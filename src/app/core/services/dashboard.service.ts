import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface Imovel {
  id: string;
  nome: string;
  endereco: string;
}

export interface Medidor {
  id: string;
  identificador: string;
  tipo: 'AGUA' | 'ENERGIA' | 'GAS';
  imovel: Imovel;
}

export interface Leitura {
  id: string;
  medidorId: string;
  valor: number;
  dataHora: string;
  medidor?: Medidor;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  getImoveis(): Observable<Imovel[]> {
    return this.http.get<Imovel[]>(`${this.apiUrl}/imoveis`).pipe(
      catchError((err) => {
        console.error('Erro ao buscar imoveis:', err);
        return of([]);
      })
    );
  }

  getMedidores(): Observable<Medidor[]> {
    return this.http.get<Medidor[]>(`${this.apiUrl}/medidores`).pipe(
      catchError((err) => {
        console.error('Erro ao buscar medidores:', err);
        return of([]);
      })
    );
  }

  getLeituras(): Observable<Leitura[]> {
    return this.http.get<Leitura[]>(`${this.apiUrl}/leituras`).pipe(
      catchError((err) => {
        console.error('Erro ao buscar leituras:', err);
        return of([]);
      })
    );
  }

  getConsumoMedidor(
    medidorId: string,
    nivel: 'dia' | 'mes' | 'ano',
    ano: number,
    mes?: number
  ): Observable<any[]> {
    let url = `${this.apiUrl}/medidores/${medidorId}/consumo?nivel=${nivel}&ano=${ano}`;
    if (nivel === 'dia' && mes) {
      url += `&mes=${mes}`;
    }
    return this.http.get<any[]>(url).pipe(
      catchError((err) => {
        console.error(`Erro ao buscar consumo para medidor ${medidorId}:`, err);
        return of([]);
      })
    );
  }
}


// import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { Observable, forkJoin, of } from 'rxjs';
// import { map, catchError } from 'rxjs/operators';

// export interface Imovel {
//   id: string;
//   nome: string;
//   endereco: string;
// }

// export interface Medidor {
//   id: string;
//   identificador: string;
//   tipo: 'AGUA' | 'ENERGIA' | 'GAS';
//   imovelId: string;
// }

// export interface Leitura {
//   id: string;
//   medidorId: string;
//   valor: number;
//   dataHora: string;
//   medidor?: Medidor;
// }

// export interface ItemConsumo {
//   periodo?: string;
//   data?: string;
//   dia?: number;
//   mes?: number;
//   ano?: number;
//   totalConsumo?: number;
//   valor?: number;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class DashboardService {
//   private readonly apiUrl = 'http://localhost:3000';

//   constructor(private http: HttpClient) {}

//   getImoveis(): Observable<Imovel[]> {
//     return this.http.get<Imovel[]>(`${this.apiUrl}/imoveis`);
//   }

//   getMedidores(): Observable<Medidor[]> {
//     return this.http.get<Medidor[]>(`${this.apiUrl}/medidores`);
//   }

//   getLeituras(): Observable<Leitura[]> {
//     return this.http.get<Leitura[]>(`${this.apiUrl}/leituras`);
//   }

//   getConsumoMedidor(
//     medidorId: string,
//     nivel: 'dia' | 'mes' | 'ano',
//     ano: number,
//     mes?: number
//   ): Observable<ItemConsumo[]> {
//     let url = `${this.apiUrl}/medidores/${medidorId}/consumo?nivel=${nivel}&ano=${ano}`;
//     if (nivel === 'dia' && mes) {
//       url += `&mes=${mes}`;
//     }
//     return this.http.get<ItemConsumo[]>(url).pipe(
//       catchError(() => of([]))
//     );
//   }
// }