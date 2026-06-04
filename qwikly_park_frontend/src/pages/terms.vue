<template>
  <VRow no-gutters class="auth-wrapper">
    <VCol md="2"></VCol>
    <VCol cols="12" md="8" class="d-flex align-center justify-center">
      <VCard flat class="my-4 mx-4 mx-md-0 my-md-12 px-4 py-4 px-md-6 py-md-6">
        <h2 class="mb-6">Conditions d'utilisation</h2>
        <p class="mb-0 mt-0">Dernière mise à jour: 04/05/2024</p>
        <p
          class="mb-2 mt-0"
        >Bonjour, pour utiliser nos services, vous acceptez les conditions d'utilisation suivantes :</p>

        <h4>1 - Compte</h4>
        <p>Pour utiliser certaines fonctionnalités du service, vous pourriez être amené à créer un compte. Vous devez fournir des informations précises, à jour et complètes lors de l'inscription. Vous êtes responsable de la confidentialité de votre compte et de votre mot de passe.</p>

        <h4>2 - Contenu</h4>
        <p
          class="mb-1"
        >Le contenu de cette application, y compris les actualités, les offres d'emploi, les bourses d'études, les réductions, les opportunités de stage et tout autre contenu, est élaboré avec le plus grand soin et professionnalisme pour garantir son exactitude et sa crédibilité.</p>
        <p>Cependant, nous ne sommes pas responsables des erreurs, des omissions ou de l'inexactitude du contenu, pouvant être dues à des raisons externes et liées à des sources tierces.</p>

        <h4>3 - Données personnelles</h4>
        <p
          class="mb-1"
        >Les informations du profil que nous collectons sont utilisées dans le but d'améliorer votre expérience et de distinguer les profils des utilisateurs.</p>
        <p>Nous collectons certaines informations telles que le sexe, l'âge, le niveau d'éducation, le numéro de téléphone, uniquement à des fins de personnalisation et d'identification au sein de l'application.</p>

        <h4>4 - Partage de données</h4>
        <p>Utilisation interne uniquement. Nous ne partageons pas vos informations personnelles avec des tiers, les données agrégées sont exclusivement utilisées pour améliorer et personnaliser votre expérience au sein de l'application.</p>

        <h4>5 - Objectif:</h4>
        <p>Lorsque vous utilisez nos services, vous devez être conscient que le contenu que nous fournissons est destiné à des fins d'information uniquement, et vous êtes seul responsable de toute décision ou action prise en fonction du contenu.</p>

        <h4>6 - Propriété intellectuelle</h4>
        <p>
          Qwikly et son logo sont la propriété exclusive de la société
          <a
            href="https://qwikly.io/"
            target="_blank"
          >Qwikly</a>, le service et son contenu original sont protégés par le droit d'auteur et les lois sur la propriété intellectuelle.
        </p>

        <h4>7 - Liens L'application</h4>
        <p>
          Peut contenir des liens vers des sites Web et des services tiers non détenus ou exploités par
          <a
            href="https://qwikly.io/"
            target="_blank"
          >Qwikly</a>. Nous ne sommes pas responsables du contenu des autres sites Web ou services auxquels vous accédez via notre contenu.
        </p>

        <h4>8 - Résiliation du service</h4>
        <p>Nous nous réservons le droit de mettre fin ou de suspendre votre accès au service à notre discrétion, sans préavis, pour quelque raison que ce soit, y compris en cas de violation de ces conditions.</p>

        <h4>9 - Mise à jour des conditions</h4>
        <p>Nous nous réservons le droit de modifier ces conditions à tout moment. Les conditions modifiées entreront en vigueur dès leur publication. Votre utilisation continue du service après la publication des modifications constitue votre acceptation des conditions mises à jour.</p>

        <h4>10 - Nous contacter</h4>
        <p>
          Si vous avez des questions ou des préoccupations concernant ces conditions ou toute autre question, veuillez nous contacter à notre adresse e-mail :
          <a
            href="mailto:contact@qwikly.io"
          >contact@qwikly.io</a>
        </p>
      </VCard>
    </VCol>
    <VCol md="2"></VCol>
  </VRow>
</template>

<route lang="yaml">
meta:
  layout: blank
  action: read
  subject: Auth
  redirectIfLoggedIn: true
</route>
