import { Router } from '@angular/router';
import { User } from './user.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, tap } from 'rxjs/operators';
import { throwError, BehaviorSubject } from 'rxjs';

export interface AuthResponseData {
  idToken: string,
  email:string,
  refreshToken:string,
  expiresIn:string,
  localId: string,
  registered?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user = new BehaviorSubject<User>(null);
  private tokenExpirationTimer: any;

  constructor(private http : HttpClient, private router: Router) { }

  signUp(email : string, password : string ) {
    return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBb0SRGd2sGpRwbLTFz7gfg-KiQ_o06HTE',
      {
        email: email,
        password: password,
        returnSecureToken:true
      })
      .pipe(
        catchError(this.handleError),
        tap(resData => {
          this.handleAuthentication(resData.email, resData.localId, resData.idToken, +resData.expiresIn)
        })
      );
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponseData>('https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyBb0SRGd2sGpRwbLTFz7gfg-KiQ_o06HTE',
      {
        email: email,
        password: password,
        returnSecureToken: true
      })
      .pipe(
        catchError(this.handleError),
        tap(resData => {
          this.handleAuthentication(resData.email, resData.localId, resData.idToken, +resData.expiresIn)
        }));
  }

  autoLogin() {
    const userData: {email: string, id:string, _token: string, _tokenExpirationDate: Date} = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
      return;      
    }
    const loadedUser = new User(userData.email, userData.id, userData._token, new Date(userData._tokenExpirationDate));
    if (loadedUser.token) {
      this.user.next(loadedUser);
      const expirationDurarion = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
      this.autoLogout(expirationDurarion);
    }
  }

  logout() {
    this.user.next(null);
    this.router.navigate(['/auth']);
    //localStorage.clear();
    localStorage.removeItem('userData');
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
    }
    this.tokenExpirationTimer = null;
  }

  autoLogout(expirationDuration: number) {
    this.tokenExpirationTimer = setTimeout(() => {
      this.logout();
    }, expirationDuration);
  }

  private handleAuthentication(email: string, userId: string, token:string, expiresIn:number) {
    const expirationDate = new Date(new Date().getTime() + +expiresIn * 1000);
    const user = new User(email, userId, token, expirationDate);
    this.user.next(user);
    this.autoLogout(+expiresIn * 1000);
    localStorage.setItem('userData',JSON.stringify(user));
  }

  private handleError(errorRes: HttpErrorResponse) {
    console.log(errorRes);

    let errorMessage = 'An unknown error occured!';
    if (!errorRes.error || !errorRes.error) {
          return throwError(errorMessage);
    }
    switch (errorRes.error.error.message) {
      case 'EMAIL_EXISTS':
        errorMessage = 'This email exists already!'
        break;
      case 'OPERATION_NOT_ALLOWED':
        errorMessage = 'This operation not allowed!'
        break;
      case 'TOO_MANY_ATTEMPTS_TRY_LATER':
        errorMessage = 'Too many attempts. Please try later!'
        break;
      case 'EMAIL_NOT_FOUND':
        errorMessage = ' There is no user record corresponding to this identifier. The user may have been deleted!'
        break;
      case 'INVALID_PASSWORD':
        errorMessage = 'The password is invalid!'
        break;
      case 'USER_DISABLED':
        errorMessage = 'The user account has been disabled by an administrator!'
        break;
      default:
        errorMessage = 'An unknown error occured!';
        break;
    }
    return throwError(errorMessage);
  };
}
