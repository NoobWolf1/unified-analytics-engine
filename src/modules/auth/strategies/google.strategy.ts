import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile, StrategyOptions } from 'passport-google-oauth20'; // Import StrategyOptions
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service'; // Assuming this path is correct

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly configService: ConfigService, // Made private readonly for consistency
    private readonly usersService: UsersService,
  ) {
    // Retrieve configuration values
    const clientID = configService.get<string>('google.clientID');
    const clientSecret = configService.get<string>('google.clientSecret');
    const callbackURL = configService.get<string>('google.callbackURL');

    // It's crucial that these configuration values are actually strings.
    // If they can be undefined, your application might fail at runtime.
    // Consider adding checks here or ensuring they are set in your .env or configuration files.
    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error('Google OAuth configuration (clientID, clientSecret, callbackURL) is missing.');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: false, // Explicitly set to false as validate method doesn't expect 'req'
    } as StrategyOptions); // Added 'as StrategyOptions' for explicit typing, though often inferred correctly with passReqToCallback
  }

  async validate(
    accessToken: string,
    refreshToken: string, // refreshToken might be undefined depending on Google's response and your scope/settings
    profile: Profile,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;

    // Google should always return an email with the 'email' scope
    if (!emails || emails.length === 0 || !emails[0].value) {
      // 'done' is called with an error, and 'false' to indicate authentication failure
      return done(new UnauthorizedException('No email found in Google profile.'), false);
    }
    const email = emails[0].value;

    // Construct the user details from the profile
    const googleUserDetails = {
      googleId: id,
      email: email,
      firstName: name?.givenName,
      lastName: name?.familyName,
      // You can also extract the picture if needed and available
      picture: photos && photos.length > 0 ? photos[0].value : undefined,
      accessToken, // You might want to store/use the accessToken
      // refreshToken is often not provided on subsequent logins unless specific prompt parameters are used
    };

    try {
      // Find or create the user in your database
      // The 'createOrUpdateUser' method in your UsersService will handle this logic.
      // It should create a new user if one doesn't exist with this googleId or email,
      // or update an existing user's details if they already exist.
      const user = await this.usersService.createOrUpdateUser(googleUserDetails);
      
      // If user creation/retrieval is successful, 'done' is called with null for the error
      // and the user object. This user object will be attached to req.user.
      done(null, user);
    } catch (err) {
      // If there's an error during user processing (e.g., database error)
      // 'done' is called with the error and 'false'.
      // You might want to log the error server-side.
      // console.error("Error in GoogleStrategy validate:", err);
      done(err, false);
    }
  }
}
