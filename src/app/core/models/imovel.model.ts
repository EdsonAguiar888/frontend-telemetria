import { Medidor } from './medidor.model';

export interface Imovel {
  id?: string;
  nome: string;
  endereco: string;
  medidores?: Medidor[];
}