import ImageKit from 'imagekit';

export const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || 'MISSING',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'MISSING',
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/MISSING',
});
