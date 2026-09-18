import { Medidor } from './medidor.model';

export interface Leitura {
  id?: string;
  dataHora: string; // ISO 8601 string
  valor: number;
  medidorId: string;
  medidor?: Medidor;
}