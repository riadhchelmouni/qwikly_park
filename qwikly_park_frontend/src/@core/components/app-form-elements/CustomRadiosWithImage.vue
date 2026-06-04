<script setup>
import { useTheme } from "vuetify";
const props = defineProps({
  selectedRadio: {
    type: String,
    required: true
  },
  radioContent: {
    type: Array,
    required: true
  },
  aspectRatio: {
    type: Number,
    required: false
  },
  gridColumn: {
    type: null,
    required: false
  }
});
const { global } = useTheme();

const emit = defineEmits(["update:selectedRadio"]);

const updateSelectedOption = value => {
  emit("update:selectedRadio", value);
};
</script>

<template>
  <VRadioGroup
    v-if="props.radioContent"
    :model-value="props.selectedRadio"
    @update:model-value="updateSelectedOption"
  >
    <VRow>
      <VCol v-for="item in props.radioContent" :key="item.bgImage" v-bind="gridColumn">
        <VLabel
          class="custom-input custom-radio rounded cursor-pointer w-100"
          :class="props.selectedRadio === item.value ? 'active' : ''"
        >
          <slot name="content" :item="item">
            <img
              :style="'aspect-ratio: ' + props.aspectRatio + ' !important; height: 100%; width: auto;'"
              :src="global.name._value === 'dark' && item.bgImageDark ? item.bgImageDark : item.bgImage"
              alt="bg-img"
              class="custom-radio-image"
            />
          </slot>

          <VRadio :id="`custom-radio-with-img-${item.value}`" :value="item.value" />
        </VLabel>

        <VLabel
          v-if="item.label || $slots.label"
          :for="`custom-radio-with-img-${item.value}`"
          class="cursor-pointer"
        >
          <slot name="label" :label="item.label">{{ item.label }}</slot>
        </VLabel>
      </VCol>
    </VRow>
  </VRadioGroup>
</template>

<style lang="scss" scoped>
.custom-radio {
  position: relative;
  padding: 10px;

  &.active {
    border-width: 2px;
  }

  .custom-radio-image {
    block-size: 100%;
    inline-size: 100%;
    min-inline-size: 100%;
  }

  .v-radio {
    visibility: hidden;
  }
}
</style>
