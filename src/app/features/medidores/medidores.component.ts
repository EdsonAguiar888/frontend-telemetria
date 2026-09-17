

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MedidoresService } from '../../core/services/medidores.service';
import { ImoveisService } from '../../core/services/imoveis.service';
import { Medidor, TipoMedidor } from '../../core/models/medidor.model';
import { Imovel } from '../../core/models/imovel.model';

@Component({
  selector: 'app-medidores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './medidores.component.html',
  styleUrls: ['./medidores.component.css']
})
export class MedidoresComponent implements OnInit {
  medidores: Medidor[] = [];
  medidoresFiltrados: Medidor[] = [];
  imoveis: Imovel[] = [];
  filtro: string = '';

  displayedColumns: string[] = ['identificador', 'tipo', 'imovel', 'acoes'];

  tiposMedidor: { valor: TipoMedidor; label: string }[] = [
    { valor: TipoMedidor.AGUA, label: 'Água' },
    { valor: TipoMedidor.GAS, label: 'Gás' },
    { valor: TipoMedidor.ENERGIA, label: 'Energia Elétrica' }
  ];

  novoMedidor: Omit<Medidor, 'id'> = {
    identificador: '',
    tipo: TipoMedidor.AGUA,
    imovelId: ''
  };

  medidorEditandoId: string | null = null;

  constructor(
    private readonly medidoresService: MedidoresService,
    private readonly imoveisService: ImoveisService,
    private readonly snackBar: MatSnackBar,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarImoveis();
    this.carregarMedidores();
  }

  carregarImoveis(): void {
    this.imoveisService.listar().subscribe({
      next: (dados) => {
        this.imoveis = dados;
        this.cdr.detectChanges();
      },
      error: () => this.notificar('Erro ao carregar lista de imóveis.')
    });
  }

  carregarMedidores(): void {
    this.medidoresService.listar().subscribe({
      next: (dados) => {
        this.medidores = dados;
        this.aplicarFiltro();
        this.cdr.detectChanges();
      },
      error: () => this.notificar('Erro ao carregar medidores.')
    });
  }

  aplicarFiltro(): void {
    const termo = this.filtro.toLowerCase().trim();
    if (!termo) {
      this.medidoresFiltrados = [...this.medidores];
      return;
    }
    this.medidoresFiltrados = this.medidores.filter(
      (m) =>
        m.identificador.toLowerCase().includes(termo) ||
        m.tipo.toLowerCase().includes(termo)
    );
  }

  salvar(): void {
    const imovelIdSelecionado = this.novoMedidor.imovelId;

    if (!this.novoMedidor.identificador.trim() || !imovelIdSelecionado) {
      this.notificar('Preencha o identificador e selecione um imóvel.');
      return;
    }

    const payload: Omit<Medidor, 'id'> = {
      identificador: this.novoMedidor.identificador,
      tipo: this.novoMedidor.tipo,
      imovelId: imovelIdSelecionado
    };

    if (this.medidorEditandoId) {
      this.medidoresService.atualizar(this.medidorEditandoId, payload).subscribe({
        next: () => {
          this.limparFormulario();
          this.notificar('Medidor atualizado com sucesso!');
          this.carregarMedidores();
        },
        error: () => this.notificar('Erro ao atualizar medidor.')
      });
    } else {
      this.medidoresService.criar(payload).subscribe({
        next: () => {
          this.limparFormulario();
          this.notificar('Medidor cadastrado com sucesso!');
          this.carregarMedidores();
        },
        error: () => this.notificar('Erro ao cadastrar medidor.')
      });
    }
  }

  editar(medidor: Medidor): void {
    this.medidorEditandoId = medidor.id ?? null;
    const idImovel = medidor.imovelId || medidor.imovel?.id || '';

    this.novoMedidor = {
      identificador: medidor.identificador,
      tipo: medidor.tipo,
      imovelId: idImovel
    };
    this.cdr.detectChanges();
  }

  excluir(id: string): void {
    if (confirm('Deseja realmente excluir este medidor?')) {
      this.medidoresService.excluir(id).subscribe({
        next: () => {
          this.notificar('Medidor excluído com sucesso!');
          this.carregarMedidores();
        },
        error: () => this.notificar('Erro ao excluir medidor.')
      });
    }
  }

  limparFormulario(): void {
    this.medidorEditandoId = null;
    this.novoMedidor = {
      identificador: '',
      tipo: TipoMedidor.AGUA,
      imovelId: ''
    };
    this.cdr.detectChanges();
  }

  getNomeImovel(medidor: Medidor): string {
    if (medidor.imovel?.nome) {
      return medidor.imovel.nome;
    }

    const idProcurado = medidor.imovelId || medidor.imovel?.id;
    if (idProcurado) {
      const imovelEncontrado = this.imoveis.find((i) => i.id === idProcurado);
      if (imovelEncontrado) {
        return imovelEncontrado.nome;
      }
    }

    return 'Imóvel não encontrado';
  }

  private notificar(mensagem: string): void {
    this.snackBar.open(mensagem, 'Fechar', { duration: 3000 });
    this.cdr.detectChanges();
  }
}








































// import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { MatTableModule } from '@angular/material/table';
// import { MatCardModule } from '@angular/material/card';
// import { MatInputModule } from '@angular/material/input';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatSelectModule } from '@angular/material/select';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
// import { MedidoresService } from '../../core/services/medidores.service';
// import { ImoveisService } from '../../core/services/imoveis.service';
// import { Medidor, TipoMedidor } from '../../core/models/medidor.model';
// import { Imovel } from '../../core/models/imovel.model';

// @Component({
//   selector: 'app-medidores',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatTableModule,
//     MatCardModule,
//     MatInputModule,
//     MatFormFieldModule,
//     MatSelectModule,
//     MatButtonModule,
//     MatIconModule,
//     MatSnackBarModule
//   ],
//   templateUrl: './medidores.component.html',
//   styleUrls: ['./medidores.component.css']
// })
// export class MedidoresComponent implements OnInit {
//   medidores: Medidor[] = [];
//   medidoresFiltrados: Medidor[] = [];
//   imoveis: Imovel[] = [];
//   filtro: string = '';

//   displayedColumns: string[] = ['identificador', 'tipo', 'imovel', 'acoes'];

//   tiposMedidor: { valor: TipoMedidor; label: string }[] = [
//     { valor: TipoMedidor.AGUA, label: 'Água' },
//     { valor: TipoMedidor.GAS, label: 'Gás' },
//     { valor: TipoMedidor.ENERGIA, label: 'Energia Elétrica' }
//   ];

//   novoMedidor: Omit<Medidor, 'id'> = {
//     identificador: '',
//     tipo: TipoMedidor.AGUA,
//     imovelId: ''
//   };

//   medidorEditandoId: string | null = null;

//   constructor(
//     private readonly medidoresService: MedidoresService,
//     private readonly imoveisService: ImoveisService,
//     private readonly snackBar: MatSnackBar,
//     private readonly cdr: ChangeDetectorRef
//   ) {}

//   ngOnInit(): void {
//     this.carregarImoveis();
//     this.carregarMedidores();
//   }

//   carregarImoveis(): void {
//     this.imoveisService.listar().subscribe({
//       next: (dados) => {
//         this.imoveis = dados;
//         this.cdr.detectChanges();
//       },
//       error: () => this.notificar('Erro ao carregar lista de imóveis.')
//     });
//   }

//   carregarMedidores(): void {
//     this.medidoresService.listar().subscribe({
//       next: (dados) => {
//         this.medidores = dados;
//         this.aplicarFiltro();
//         this.cdr.detectChanges();
//       },
//       error: () => this.notificar('Erro ao carregar medidores.')
//     });
//   }

//   aplicarFiltro(): void {
//     const termo = this.filtro.toLowerCase().trim();
//     if (!termo) {
//       this.medidoresFiltrados = [...this.medidores];
//       return;
//     }
//     this.medidoresFiltrados = this.medidores.filter(
//       (m) =>
//         m.identificador.toLowerCase().includes(termo) ||
//         m.tipo.toLowerCase().includes(termo)
//     );
//   }



//   salvar(): void {
//     if (!this.novoMedidor.identificador.trim() || !this.novoMedidor.imovelId) {
//       this.notificar('Preencha o identificador e selecione um imóvel.');
//       return;
//     }

//     if (this.medidorEditandoId) {
//       this.medidoresService.atualizar(this.medidorEditandoId, this.novoMedidor).subscribe({
//         next: () => {
//           this.notificar('Medidor atualizado com sucesso!');
//           this.limparFormulario();
//           this.carregarMedidores();
//         },
//         error: () => this.notificar('Erro ao atualizar medidor.')
//       });
//     } else {
//       this.medidoresService.criar(this.novoMedidor).subscribe({
//         next: () => {
//           this.notificar('Medidor cadastrado com sucesso!');
//           this.limparFormulario();
//           this.carregarMedidores();
//         },
//         error: () => this.notificar('Erro ao cadastrar medidor.')
//       });
//     }
//   }

//   editar(medidor: Medidor): void {
//     this.medidorEditandoId = medidor.id ?? null;
//     this.novoMedidor = {
//       identificador: medidor.identificador,
//       tipo: medidor.tipo,
//       imovelId: medidor.imovelId
//     };
//   }

//   excluir(id: string): void {
//     if (confirm('Deseja realmente excluir este medidor?')) {
//       this.medidoresService.excluir(id).subscribe({
//         next: () => {
//           this.notificar('Medidor excluído com sucesso!');
//           this.carregarMedidores();
//         },
//         error: () => this.notificar('Erro ao excluir medidor.')
//       });
//     }
//   }

//   limparFormulario(): void {
//     this.medidorEditandoId = null;
//     this.novoMedidor = {
//       identificador: '',
//       tipo: TipoMedidor.AGUA,
//       imovelId: ''
//     };
//   }



//   getNomeImovel(imovelId: string): string {
//     const imovel = this.imoveis.find((i) => i.id === imovelId);
//     return imovel ? imovel.nome : 'Imóvel não encontrado';
//     console.log(imovel?.nome +"e" + imovel?.endereco)
//   }

//   private notificar(mensagem: string): void {
//     this.snackBar.open(mensagem, 'Fechar', { duration: 3000 });
//   }
// }