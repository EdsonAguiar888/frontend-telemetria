import { Imovel } from './imovel.model';
import { Leitura } from './leitura.model';

export enum TipoMedidor {
  AGUA = 'AGUA',
  ENERGIA = 'ENERGIA',
  GAS = 'GAS',
}

export const TipoMedidorLabel: Record<TipoMedidor, string> = {
  [TipoMedidor.AGUA]: 'Água',
  [TipoMedidor.ENERGIA]: 'Energia',
  [TipoMedidor.GAS]: 'Gás',
};

export interface Medidor {
  id?: string;
  identificador: string;
  tipo: TipoMedidor;
  imovelId: string;
  imovel?: Imovel;
  leituras?: Leitura[];
}