import { Vemetric } from '@vemetric/node';

if (!process.env.VEMETRIC_TOKEN) {
  throw new Error('VEMETRIC_TOKEN environment variable is not set');
}

export const vemetric = new Vemetric({
  token: process.env.VEMETRIC_TOKEN!,
});
