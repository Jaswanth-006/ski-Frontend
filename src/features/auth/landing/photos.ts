// Wikimedia Commons photos (resized to WebP). CC licences require the credits shown in the footer.
import cylinder5kg from '@/assets/landing/cylinder-5kg.webp'
import cylinderDomestic from '@/assets/landing/cylinder-domestic.webp'
import cylinderHero from '@/assets/landing/cylinder-hero.webp'
import cylinderPair from '@/assets/landing/cylinder-pair.webp'
import cylinderStack from '@/assets/landing/cylinder-stack.webp'
import deliveryVehicle from '@/assets/landing/delivery-vehicle.webp'
import distribution from '@/assets/landing/distribution.webp'
import shopfront from '@/assets/landing/shopfront.webp'

export const PHOTOS = {
  cylinder5kg,
  cylinderDomestic,
  cylinderHero,
  cylinderPair,
  cylinderStack,
  deliveryVehicle,
  distribution,
  shopfront,
}

const BY_SA_3 = { license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0' }
const BY_SA_4 = { license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0' }
const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const PHOTO_CREDITS = [
  { title: 'Gas cylinder india', author: 'Sugeesh', url: `${COMMONS}Gas_cylinder_india.jpg`, ...BY_SA_4 },
  { title: 'Cylinder, gas, Indane', author: 'தகவலுழவன்', url: `${COMMONS}Cylinder,gas,_Indane,Tamil_Nadu452.jpeg`, ...BY_SA_3 },
  { title: 'Cylinder, gas, Indane, both', author: 'தகவலுழவன்', url: `${COMMONS}Cylinder,gas,_Indane,both,Tamil_Nadu454.jpeg`, ...BY_SA_3 },
  { title: 'Cylinder, gas, Indane, small', author: 'தகவலுழவன்', url: `${COMMONS}Cylinder,gas,_Indane,small,Tamil_Nadu453.jpeg`, ...BY_SA_3 },
  { title: 'Indane LPG cylinders of Tamilnadu', author: 'Thamizhpparithi Maari', url: `${COMMONS}Indane_LPG_cylinders_of_Tamilnadu.jpg`, ...BY_SA_4 },
  { title: 'Gas cylinder carrier in Hyderabad', author: 'Jay.Jarosz', url: `${COMMONS}Gas_cylinder_carrier_in_Hyderabad.jpg`, ...BY_SA_4 },
  { title: 'Bargaon Indane', author: 'DK6771', url: `${COMMONS}Bargaon_Indane.jpg`, ...BY_SA_4 },
  {
    title: 'LPG Distribution - Kalyani Expressway - Kolkata',
    author: 'Biswarup Ganguly',
    url: `${COMMONS}LPG_Distribution_-_Kalyani_Expressway_-_Kolkata_2017-03-31_1139.JPG`,
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
  },
]
