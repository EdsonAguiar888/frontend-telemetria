import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Imovel } from '../models/imovel.model';

@Injectable({
  providedIn: 'root'
})
export class ImoveisService {
  private readonly apiUrl = 'http://localhost:3000/imoveis';

  constructor(private readonly http: HttpClient) {}

  // GET /imoveis - Lista todos os imóveis com seus medidores
  listar(): Observable<Imovel[]> {
    return this.http.get<Imovel[]>(this.apiUrl);
  }

  // GET /imoveis/:id - Busca um imóvel por ID
  buscarPorId(id: string): Observable<Imovel> {
    return this.http.get<Imovel>(`${this.apiUrl}/${id}`);
  }

  // POST /imoveis - Cadastra um novo imóvel
  criar(imovel: Omit<Imovel, 'id'>): Observable<Imovel> {
    return this.http.post<Imovel>(this.apiUrl, imovel);
  }

  // PATCH /imoveis/:id - Atualiza parcialmente um imóvel
  atualizar(id: string, imovel: Partial<Imovel>): Observable<Imovel> {
    return this.http.patch<Imovel>(`${this.apiUrl}/${id}`, imovel);
  }

  // DELETE /imoveis/:id - Remove um imóvel (retorna 200 OK com corpo vazio)
  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}