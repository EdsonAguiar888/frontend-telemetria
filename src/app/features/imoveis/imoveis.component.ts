

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ImoveisService } from '../../core/services/imoveis.service';
import { Imovel } from '../../core/models/imovel.model';

@Component({
  selector: 'app-imoveis',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './imoveis.component.html',
  styleUrls: ['./imoveis.component.css']
})
export class ImoveisComponent implements OnInit {
  imoveis: Imovel[] = [];
  imoveisFiltrados: Imovel[] = [];
  filtro: string = '';
  displayedColumns: string[] = ['nome', 'endereco', 'medidoresCount', 'acoes'];

  novoImovel: Omit<Imovel, 'id'> = {
    nome: '',
    endereco: ''
  };

  imovelEditandoId: string | null = null;

  constructor(
    private readonly imoveisService: ImoveisService,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarImoveis();
  }

  carregarImoveis(): void {
    this.imoveisService.listar().subscribe({
      next: (dados) => {
        this.imoveis = dados;
        this.aplicarFiltro();
        this.cdr.detectChanges();
      },
      error: () => this.notificar('Erro ao carregar imóveis.')
    });
  }

  aplicarFiltro(): void {
    const termo = this.filtro.toLowerCase().trim();
    if (!termo) {
      this.imoveisFiltrados = [...this.imoveis];
      return;
    }
    this.imoveisFiltrados = this.imoveis.filter(
      (imovel) =>
        imovel.nome.toLowerCase().includes(termo) ||
        imovel.endereco.toLowerCase().includes(termo)
    );
  }

  salvar(): void {
    if (!this.novoImovel.nome.trim() || !this.novoImovel.endereco.trim()) {
      return;
    }

    if (this.imovelEditandoId) {
      this.imoveisService.atualizar(this.imovelEditandoId, this.novoImovel).subscribe({
        next: () => {
          this.notificar('Imóvel atualizado com sucesso!');
          this.limparFormulario();
          this.carregarImoveis();
        },
        error: () => this.notificar('Erro ao atualizar imóvel.')
      });
    } else {
      this.imoveisService.criar(this.novoImovel).subscribe({
        next: () => {
          this.notificar('Imóvel cadastrado com sucesso!');
          this.limparFormulario();
          this.carregarImoveis();
        },
        error: () => this.notificar('Erro ao cadastrar imóvel.')
      });
    }
  }

  editar(imovel: Imovel): void {
    this.imovelEditandoId = imovel.id ?? null;
    this.novoImovel = {
      nome: imovel.nome,
      endereco: imovel.endereco
    };
    this.cdr.detectChanges();
  }

  excluir(id: string): void {
    if (confirm('Deseja realmente excluir este imóvel?')) {
      this.imoveisService.excluir(id).subscribe({
        next: () => {
          this.notificar('Imóvel excluído com sucesso!');
          this.carregarImoveis();
        },
        error: () => this.notificar('Erro ao excluir imóvel.')
      });
    }
  }

  limparFormulario(): void {
    this.imovelEditandoId = null;
    this.novoImovel = { nome: '', endereco: '' };
    this.cdr.detectChanges();
  }

  private notificar(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', { duration: 3000 });
  }
}
























// import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MatTableModule } from '@angular/material/table';
// import { MatCardModule } from '@angular/material/card';
// import { MatInputModule } from '@angular/material/input';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
// import { ImoveisService } from '../../core/services/imoveis.service';
// import { Imovel } from '../../core/models/imovel.model';

// @Component({
//   selector: 'app-imoveis',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatTableModule,
//     MatCardModule,
//     MatInputModule,
//     MatFormFieldModule,
//     MatButtonModule,
//     MatIconModule,
//     MatSnackBarModule
//   ],
//   templateUrl: './imoveis.component.html',
//   styleUrls: ['./imoveis.component.css']
// })
// export class ImoveisComponent implements OnInit {
//   imoveis: Imovel[] = [];
//   imoveisFiltrados: Imovel[] = [];
//   filtro: string = '';
//   displayedColumns: string[] = ['nome', 'endereco', 'medidoresCount', 'acoes'];

//   novoImovel: Omit<Imovel, 'id'> = {
//     nome: '',
//     endereco: ''
//   };

//   imovelEditandoId: string | null = null;

//   constructor(
//     private readonly imoveisService: ImoveisService,
//     private readonly snackBar: MatSnackBar,
//     private readonly cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit(): void {
//     this.carregarImoveis();
//   }

//   carregarImoveis(): void {
//     this.imoveisService.listar().subscribe({
//       next: (dados) => {
//         this.imoveis = dados;
//         this.aplicarFiltro();
//         this.cdr.detectChanges(); // Notifica o Angular explicitamente da mudança de dados
//       },
//       error: () => this.notificar('Erro ao carregar imóveis.')
//     });
//   }

//   aplicarFiltro(): void {
//     const termo = this.filtro.toLowerCase().trim();
//     if (!termo) {
//       this.imoveisFiltrados = [...this.imoveis];
//       return;
//     }
//     this.imoveisFiltrados = this.imoveis.filter(
//       (imovel) =>
//         imovel.nome.toLowerCase().includes(termo) ||
//         imovel.endereco.toLowerCase().includes(termo)
//     );
//   }

//   salvar(): void {
//     if (!this.novoImovel.nome.trim() || !this.novoImovel.endereco.trim()) {
//       return;
//     }

//     if (this.imovelEditandoId) {
//       this.imoveisService.atualizar(this.imovelEditandoId, this.novoImovel).subscribe({
//         next: () => {
//           this.notificar('Imóvel atualizado com sucesso!');
//           this.limparFormulario();
//           this.carregarImoveis();
//         },
//         error: () => this.notificar('Erro ao atualizar imóvel.')
//       });
//     } else {
//       this.imoveisService.criar(this.novoImovel).subscribe({
//         next: () => {
//           this.notificar('Imóvel cadastrado com sucesso!');
//           this.limparFormulario();
//           this.carregarImoveis();
//         },
//         error: () => this.notificar('Erro ao cadastrar imóvel.')
//       });
//     }
//   }

//   editar(imovel: Imovel): void {
//     this.imovelEditandoId = imovel.id ?? null;
//     this.novoImovel = {
//       nome: imovel.nome,
//       endereco: imovel.endereco
//     };
//   }

//   excluir(id: string): void {
//     if (confirm('Deseja realmente excluir este imóvel?')) {
//       this.imoveisService.excluir(id).subscribe({
//         next: () => {
//           this.notificar('Imóvel excluído com sucesso!');
//           this.carregarImoveis();
//         },
//         error: () => this.notificar('Erro ao excluir imóvel.')
//       });
//     }
//   }

//   limparFormulario(): void {
//     this.imovelEditandoId = null;
//     this.novoImovel = { nome: '', endereco: '' };
//   }

//   private notificar(mensagem: string): void {
//     this.snackBar.open(mensagem, 'Fechar', { duration: 3000 });
//   }
// }



















// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MatTableModule } from '@angular/material/table';
// import { MatCardModule } from '@angular/material/card';
// import { MatInputModule } from '@angular/material/input';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { ImoveisService } from '../../core/services/imoveis.service';
// import { Imovel } from '../../core/models/imovel.model';

// @Component({
//   selector: 'app-imoveis',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatTableModule,
//     MatCardModule,
//     MatInputModule,
//     MatFormFieldModule,
//     MatButtonModule,
//     MatIconModule
//   ],
//   templateUrl: './imoveis.component.html',
//   styleUrls: ['./imoveis.component.css']
// })
// export class ImoveisComponent implements OnInit {
//   imoveis: Imovel[] = [];
//   displayedColumns: string[] = ['nome', 'endereco', 'medidoresCount', 'acoes'];

//   novoImovel: Omit<Imovel, 'id'> = {
//     nome: '',
//     endereco: ''
//   };

//   imovelEditandoId: string | null = null;

//   constructor(private readonly imoveisService: ImoveisService) {}

//   ngOnInit(): void {
//     this.carregarImoveis();
//   }

//   carregarImoveis(): void {
//     this.imoveisService.listar().subscribe({
//       next: (dados) => (this.imoveis = dados),
//       error: (err) => console.error('Erro ao carregar imóveis:', err)
//     });
//   }

//   salvar(): void {
//     if (!this.novoImovel.nome.trim() || !this.novoImovel.endereco.trim()) {
//       return;
//     }

//     if (this.imovelEditandoId) {
//       this.imoveisService.atualizar(this.imovelEditandoId, this.novoImovel).subscribe({
//         next: () => {
//           this.limparFormulario();
//           this.carregarImoveis();
//         },
//         error: (err) => console.error('Erro ao atualizar imóvel:', err)
//       });
//     } else {
//       this.imoveisService.criar(this.novoImovel).subscribe({
//         next: () => {
//           this.limparFormulario();
//           this.carregarImoveis();
//         },
//         error: (err) => console.error('Erro ao cadastrar imóvel:', err)
//       });
//     }
//   }

//   editar(imovel: Imovel): void {
//     this.imovelEditandoId = imovel.id ?? null;
//     this.novoImovel = {
//       nome: imovel.nome,
//       endereco: imovel.endereco
//     };
//   }

//   excluir(id: string): void {
//     if (confirm('Deseja realmente excluir este imóvel?')) {
//       this.imoveisService.excluir(id).subscribe({
//         next: () => this.carregarImoveis(),
//         error: (err) => console.error('Erro ao excluir imóvel:', err)
//       });
//     }
//   }

//   limparFormulario(): void {
//     this.imovelEditandoId = null;
//     this.novoImovel = { nome: '', endereco: '' };
//   }
// }