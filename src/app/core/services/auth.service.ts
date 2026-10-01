import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: 'ADMIN' | 'USUARIO';
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
  usuario: Usuario;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiUrl = '/api/auth/login';

  private readonly TOKEN_KEY = 'token';
  private readonly USER_KEY = 'usuario';

  constructor(private readonly http: HttpClient) {}

  login(dados: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.apiUrl, dados).pipe(
      tap((resposta) => {
        localStorage.setItem(this.TOKEN_KEY, resposta.access_token);
        localStorage.setItem(
          this.USER_KEY,
          JSON.stringify(resposta.usuario)
        );
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUsuario(): Usuario | null {
    const usuario = localStorage.getItem(this.USER_KEY);

    if (!usuario) {
      return null;
    }

    try {
      return JSON.parse(usuario) as Usuario;
    } catch {
      return null;
    }
  }

  getRole(): 'ADMIN' | 'USUARIO' | null {
    return this.getUsuario()?.role ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.getRole() === 'ADMIN';
  }

  isUsuario(): boolean {
    return this.getRole() === 'USUARIO';
  }
}