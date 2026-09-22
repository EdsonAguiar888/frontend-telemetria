export type TipoUtilidade = 'TODOS' | 'AGUA' | 'ENERGIA' | 'GAS';
export type NivelDrillDown = 'ANO' | 'MES' | 'DIA' | 'HORA';

export interface LeituraDetalhada {
  data: string;
  hora: string;
  agua: number;
  energia: number;
  gas: number;
}

export interface ConsumoItem {
  label: string;
  agua: number;
  energia: number;
  gas: number;
}