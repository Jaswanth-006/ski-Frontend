// Wikimedia Commons photos (resized to WebP). CC licences require the credits shown in the footer.
// cylinder-5kg-ftl and cylinder-19kg* are IndiaMART sellers' product photos (background removed); swap for own photos when available.
import cylinder19kg from '@/assets/landing/cylinder-19kg.webp'
import cylinder19kgXtratej from '@/assets/landing/cylinder-19kg-xtratej.webp'
import cylinder5kgFtl from '@/assets/landing/cylinder-5kg-ftl.webp'
import cylinderCutout from '@/assets/landing/cylinder-cutout.webp'
import cylinderStack from '@/assets/landing/cylinder-stack.webp'
import deliveryVehicle from '@/assets/landing/delivery-vehicle.webp'
import distribution from '@/assets/landing/distribution.webp'
import shopfront from '@/assets/landing/shopfront.webp'

export const PHOTOS = {
  cylinder19kg,
  cylinder19kgXtratej,
  cylinder5kgFtl,
  cylinderCutout,
  cylinderStack,
  deliveryVehicle,
  distribution,
  shopfront,
}

const BY_SA_4 = { license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0' }
const COMMONS = 'https://commons.wikimedia.org/wiki/File:'

export const PHOTO_CREDITS = [
  {
    title: 'Gas cylinder india',
    author: 'Sugeesh',
    url: `${COMMONS}Gas_cylinder_india.jpg`,
    note: 'background removed, resized',
    ...BY_SA_4,
  },
  { title: 'Indane LPG cylinders of Tamilnadu', author: 'Thamizhpparithi Maari', url: `${COMMONS}Indane_LPG_cylinders_of_Tamilnadu.jpg`, note: 'resized', ...BY_SA_4 },
  { title: 'Gas cylinder carrier in Hyderabad', author: 'Jay.Jarosz', url: `${COMMONS}Gas_cylinder_carrier_in_Hyderabad.jpg`, note: 'resized', ...BY_SA_4 },
  { title: 'Bargaon Indane', author: 'DK6771', url: `${COMMONS}Bargaon_Indane.jpg`, note: 'resized', ...BY_SA_4 },
  {
    title: 'LPG Distribution - Kalyani Expressway - Kolkata',
    author: 'Biswarup Ganguly',
    url: `${COMMONS}LPG_Distribution_-_Kalyani_Expressway_-_Kolkata_2017-03-31_1139.JPG`,
    note: 'resized',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
  },
]
