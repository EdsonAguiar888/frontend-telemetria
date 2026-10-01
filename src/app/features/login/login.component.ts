import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  email = '';
  senha = '';

  carregando = false;
  erro = '';

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  entrar(): void {

    this.erro = '';

    if (!this.email || !this.senha) {
      this.erro = 'Informe o email e a senha.';
      return;
    }

    this.carregando = true;

    this.authService.login({
      email: this.email,
      senha: this.senha
    }).subscribe({
      next: () => {
        this.carregando = false;
        this.router.navigate(['/dashboard']);
      },

      error: (erro) => {
        this.carregando = false;

        if (erro.status === 401) {
          this.erro = 'Email ou senha inválidos.';
        } else if (erro.status === 403) {
          this.erro = 'Usuário sem permissão para acessar o sistema.';
        } else {
          this.erro = 'Não foi possível realizar o login.';
        }

        console.error('Erro no login:', erro);
      }
    });
  }
}