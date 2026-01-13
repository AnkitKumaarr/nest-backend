import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GoogleService {
  async getGoogleUser(token: string) {
    // Manually fetch user info from Google using the access token from frontend
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });

    return {
      email: data.email,
      firstName: data.given_name,
      lastName: data.family_name,
      avatarUrl: data.picture, // Storing image from Google
      googleId: data.sub,
    };
  }
}