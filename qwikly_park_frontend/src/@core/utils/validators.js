import { isEmpty, isEmptyArray, isNullOrUndefined } from './helpers.js'

// 👉 Required Validator
export const requiredValidator = value => {
  if (isNullOrUndefined(value) || isEmptyArray(value) || value === false)
    return 'Ce champ est requis'
  
  return !!String(value).trim().length || 'Ce champ est requis'
}

// 👉 Email Validator
export const emailValidator = value => {
  if (isEmpty(value))
    return true
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  if (Array.isArray(value))
    return value.every(val => re.test(String(val))) || 'Adresse e-mail invalide'
  
  return re.test(String(value)) || 'Adresse e-mail invalide'
}

// 👉 DZ Phone Validator
export const dzPhoneValidator = phone => {
  // const regExp = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/
  const regExp = /^(((5|6|7)[0-9]{8}))$/
  const validPhone = regExp.test(phone)

  return (
    // eslint-disable-next-line operator-linebreak
    validPhone ||
    'Numéro de téléphone invalide')
}

// 👉 FR Phone Validator
export const frPhoneValidator = phone => {
  // const regExp = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/
  const regExp = /^[1-9](\d{2}){4}$/
  const validPhone = regExp.test(phone)

  return (
    // eslint-disable-next-line operator-linebreak
    validPhone ||
    'Numéro de téléphone invalide')
}

// 👉 Phone Validator
export const phoneValidator = phone => {
  // const regExp = /(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%&*()]).{8,}/
  const regExp = /^(((5|6|7)[0-9]{8}))$/
  const validPhone = regExp.test(phone)

  return (
    // eslint-disable-next-line operator-linebreak
    validPhone ||
    'Numéro de téléphone invalide')
}


// 👉 Identifier Validator
export const IdentifierValidator = (value) => {
  if (isEmpty(value))
    return true
  const regeX = new RegExp(/^(\+213(5|6|7)[0-9]{8}|\+33[1-9][0-9]{8}|(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,})))$/)
  return regeX.test(String(value)) || 'Adresse e-mail ou numéro de téléphone invalide'
}

// 👉 Password Validator
export const passwordValidator = password => {
  const regExp = /^[A-Za-z\d@$!%*#?&]{7,}$/
  const validPassword = regExp.test(password)

  return (
    // eslint-disable-next-line operator-linebreak
    validPassword ||
    "Le mot de passe doit être d'au moins 8 caractères")
}

// 👉 Confirm Password Validator
export const confirmedValidator = (value, target) => value === target || 'La confirmation du mot de passe ne correspond pas'

// 👉 Positive Number Validator
export const positiveNumberValidator = value => {
  if (parseFloat(value) > 0)
    return true
  
  return 'Ce champ doit être supérieur à 0'
}

// 👉 Integer Validator
export const integerValidator = value => {
  if (isEmpty(value))
    return true
  if (Array.isArray(value))
    return value.every(val => /^-?[0-9]+$/.test(String(val))) || 'Ce champ doit être un nombre entier'
  
  return /^-?[0-9]+$/.test(String(value)) || 'Ce champ doit être un nombre entier'
}

// 👉 Between Validator
export const betweenValidator = (value, min, max) => {
  const valueAsNumber = Number(value)
  
  return (Number(min) <= valueAsNumber && Number(max) >= valueAsNumber) || `Enter number between ${min} and ${max}`
}

// 👉 String Length Validator
export const stringLengthValidator = (value) => {
  if (isEmpty(value))
    return true

  return String(value).length <= 255 || `La longueur du texte du champ ne doit pas dépasser 255 caractères`
}

// 👉 Regex Validator
export const regexValidator = (value, regex) => {
  if (isEmpty(value))
    return true
  let regeX = regex
  if (typeof regeX === 'string')
    regeX = new RegExp(regeX)
  if (Array.isArray(value))
    return value.every(val => regexValidator(val, regeX))
  
  return regeX.test(String(value)) || 'The Regex field format is invalid'
}

// 👉 Alpha Validator
export const alphaValidator = value => {
  if (isEmpty(value))
    return true
  
  return /^[A-Z]*$/i.test(String(value)) || 'The Alpha field may only contain alphabetic characters'
}

// 👉 URL Validator
export const urlValidator = value => {
  if (isEmpty(value))
    return true
  const re = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/
  
  return re.test(String(value)) || 'URL is invalid'
}

// 👉 Length Validator
export const lengthValidator = (value, length) => {
  if (isEmpty(value))
    return true
  
  return String(value).length === length || `The Min Character field must be at least ${length} characters`
}

// 👉 Alpha-dash Validator
export const alphaDashValidator = value => {
  if (isEmpty(value))
    return true
  const valueAsString = String(value)
  
  return /^[0-9A-Z_-]*$/i.test(valueAsString) || 'All Character are not valid'
}
