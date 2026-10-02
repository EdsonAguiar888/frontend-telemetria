import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';

import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {

    const rolePermitida = route.data['role'];

    const roleAtual = this.authService.getRole();

    if (roleAtual === rolePermitida) {
      return true;
    }

    this.router.navigate(['/dashboard']);

    return false;
  }
}