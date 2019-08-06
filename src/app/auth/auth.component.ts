import { Router } from '@angular/router';
import { Subscription, Observable } from 'rxjs';
import { AuthService, AuthResponseData } from './auth.service';
import { NgForm } from '@angular/forms';
import { Component, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html'
})
export class AuthComponent implements OnDestroy {
  isLoginMode = false;
  isLoading = false;
  error:string = null;
  signSub = new Subscription();

  constructor(private authService: AuthService, private router : Router) { }

  onSwitchMode() {
    this.isLoginMode = !this.isLoginMode;
  }

  onSubmit(form: NgForm) {
    if (!form.valid) {
      return;
    }
    const email = form.value.email;
    const password = form.value.password;
    let authObs: Observable<AuthResponseData>;

    this.isLoading = true;
    if (this.isLoginMode) {
      authObs = this.authService.login(email, password)
    } else {
      authObs = this.authService.signUp(email, password);
    }   

    this.signSub = authObs.subscribe(
        response => {
          this.isLoading = false;
          this.router.navigate(['/recipes'])
        },
        errorMessage => {
          this.isLoading = false;          
          this.error = errorMessage;          
        }
      );
    form.reset();
  }

  ngOnDestroy(): void {
    this.signSub.unsubscribe();
  }
}
