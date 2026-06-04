<template>
  <VNavigationDrawer
    temporary
    :width="520"
    location="end"
    class="scrollable-content"
    :model-value="isOpen"
    @update:model-value="(val) => $emit('update:isOpen', val)"
  >
    <AppDrawerHeaderSection title="Modifier l'actualité" @cancel="close" />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <VForm ref="editForm">
            <VRow>

              <!-- Image upload -->
              <VCol cols="12">
                <p class="field-label mb-2">Image de couverture</p>
                <div class="img-upload-zone" @click="$refs.imgInput.click()">
                  <img v-if="form.imagePreview" :src="form.imagePreview" class="img-preview" alt="" />
                  <div v-else class="img-upload-empty">
                    <VIcon icon="tabler-photo" size="36" color="#d0d0d0" />
                    <span class="img-hint-inner">Cliquer pour changer l'image</span>
                  </div>
                </div>
                <p class="img-hint mt-1 mb-2">Formats autorisés : JPG, PNG, GIF. Max 2 Mo.</p>
                <input ref="imgInput" type="file" accept="image/*" class="d-none" @change="onImgChange" />
              </VCol>

              <!-- Titre -->
              <VCol cols="12">
                <AppTextField
                  label="Titre de l'actualité"
                  v-model="form.title"
                  :rules="[requiredValidator]"
                  placeholder="Entrer le titre..."
                />
              </VCol>

              <!-- Contenu -->
              <VCol cols="12">
                <p class="field-label mb-1">Contenu</p>
                <textarea
                  v-model="form.content"
                  placeholder="Rédigez le contenu de l'actualité..."
                  class="custom-textarea"
                  rows="5"
                ></textarea>
              </VCol>

              <!-- Parcs concernés (REQUIS) -->
              <VCol cols="12">
                <p class="field-label mb-1">
                  Parc(s) concerné(s) <span style="color:#e53935">*</span>
                </p>
                <p style="font-size:11px;color:#9e9e9e;margin:-2px 0 6px">
                  L'actualité sera visible uniquement sur les parcs sélectionnés
                </p>
                <AppSelect
                  v-model="form.park_ids"
                  :items="parcOptions"
                  item-title="name"
                  item-value="id"
                  multiple
                  chips
                  closable-chips
                  placeholder="Sélectionner le(s) parc(s)..."
                  :rules="[v => (v && v.length > 0) || 'Sélectionnez au moins un parc']"
                />
              </VCol>

              <!-- Date de publication -->
              <VCol cols="12">
                <AppDateTimePicker
                  v-model="form.published_at"
                  label="Date de publication"
                  :config="{ dateFormat: 'Y-m-d' }"
                />
              </VCol>

              <!-- Statut -->
              <VCol cols="12">
                <AppSelect
                  label="Statut"
                  v-model="form.status"
                  :items="statusOptions"
                  item-title="label"
                  item-value="value"
                  :rules="[requiredValidator]"
                />
              </VCol>

            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>

    <template v-slot:append>
      <VCard flat>
        <VCardText>
          <VRow>
            <VCol cols="12">
              <VBtn class="me-3" @click="save" :loading="loading" :disabled="loading">Sauvegarder</VBtn>
              <VBtn type="reset" variant="tonal" color="secondary" @click="close">Annuler</VBtn>
            </VCol>
          </VRow>
        </VCardText>
      </VCard>
    </template>
  </VNavigationDrawer>

  <VSnackbar v-model="isSnackbarVisible" location="bottom end" variant="flat" :color="snackBar.color">
    {{ snackBar.message }}
  </VSnackbar>
</template>

<script>
import { $api } from "@/utils/api";
import { PerfectScrollbar } from "vue3-perfect-scrollbar";
import { requiredValidator } from "@validators";

export default {
  emits: ["update:isOpen", "saved"],

  components: { PerfectScrollbar },

  setup() {
    return { requiredValidator };
  },

  props: {
    isOpen:      { type: Boolean, required: true },
    current:     { type: Object,  default: null  },
    parcOptions: { type: Array,   default: () => [] },
  },

  data() {
    return {
      form: {
        title:        "",
        content:      "",
        park_ids:     [],
        published_at: null,
        status:       "draft",
        image:        null,
        imagePreview: null,
      },
      loading: false,
      isSnackbarVisible: false,
      snackBar: { message: "", color: "" },
      statusOptions: [
        { label: "Brouillon", value: "draft"     },
        { label: "Publié",    value: "published" },
      ],
    };
  },

  watch: {
    isOpen(val) {
      if (val && this.current) {
        this.form = {
          title:        this.current.title        || "",
          content:      this.current.content || this.current.description || "",
          park_ids:     (this.current.parks || []).map(p => p.id ?? p),
          published_at: this.current.published_at || null,
          status:       this.current.status       || "draft",
          image:        null,
          imagePreview: this.current.image_url     || null,
        };
        this.$nextTick(() => this.$refs.editForm?.resetValidation());
      }
    },
  },

  methods: {
    close() {
      this.$emit("update:isOpen", false);
    },

    onImgChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.form.image = file;
      this.form.imagePreview = URL.createObjectURL(file);
    },

    save() {
      this.$refs.editForm.validate().then(({ valid }) => {
        if (!valid) return;
        this.loading = true;

        const fd = new FormData();
        fd.append("_method",      "PUT");
        fd.append("title",        this.form.title);
        fd.append("description",  this.form.content || "");
        fd.append("status",       this.form.status);
        if (this.form.published_at) fd.append("published_at", this.form.published_at);
        if (this.form.image)        fd.append("image",        this.form.image);
        (this.form.park_ids || []).forEach((id, i) => fd.append(`parks[${i}]`, id));

        $api(`/news/${this.current.id}`, { method: "POST", body: fd })
          .then((res) => {
            this.loading = false;
            this.$emit("saved", res);
            this.close();
          })
          .catch(() => {
            this.loading = false;
            this.snackBar = { message: "Impossible de modifier l'actualité.", color: "error" };
            this.isSnackbarVisible = true;
          });
      });
    },
  },
};
</script>

<style scoped>
.field-label { font-size: 13px; font-weight: 600; color: #1a1a2e; margin: 0; }

.img-upload-zone {
  border: 2px dashed #e0e0e0;
  border-radius: 10px;
  min-height: 130px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.2s;
}
.img-upload-zone:hover { border-color: #E8A838; }

.img-preview { width: 100%; height: 160px; object-fit: cover; display: block; }

.img-upload-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.img-hint-inner { font-size: 12px; color: #9e9e9e; }
.img-hint       { font-size: 11px; color: #bdbdbd; margin: 0; }

.custom-textarea {
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  font-family: inherit;
  color: #1a1a2e;
  resize: vertical;
  outline: none;
  transition: border-color 0.2s;
}
.custom-textarea:focus { border-color: #E8A838; }
</style>
