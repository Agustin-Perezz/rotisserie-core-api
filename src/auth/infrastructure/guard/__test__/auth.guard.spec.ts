import { IRequestWithUser } from '@auth/domain/interfaces/types/access-token';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { FirebaseService } from '@/firebase/application/services/firebase.service';

import { AuthGuard } from '../auth.guard';

// Create a mock for FirebaseService
const mockFirebaseService = {
  getAuth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn(),
  }),
};

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let mockVerifyIdToken: jest.Mock;
  let firebaseService: FirebaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: FirebaseService, useValue: mockFirebaseService },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    firebaseService = module.get<FirebaseService>(FirebaseService);
    mockVerifyIdToken = jest.fn();
    jest
      .spyOn(firebaseService.getAuth(), 'verifyIdToken')
      .mockImplementation(mockVerifyIdToken);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockExecutionContext: ExecutionContext;
    let mockRequest: Partial<IRequestWithUser> & {
      headers: {
        authorization?: string;
      };
    };

    beforeEach(() => {
      mockRequest = {
        headers: {
          authorization: undefined,
        },
        user: undefined,
      };

      mockExecutionContext = {
        switchToHttp: () => ({
          getRequest: (): typeof mockRequest => mockRequest,
        }),
      } as unknown as ExecutionContext;
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      mockRequest.headers.authorization = undefined;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token type is not Bearer', async () => {
      mockRequest.headers.authorization = 'Basic token123';

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when token verification fails', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';
      mockVerifyIdToken.mockRejectedValueOnce(new Error('Invalid token'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should set user in request when token is valid', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';
      const mockDecodedToken = {
        email: 'test@example.com',
        sub: 'user-id-123',
      };
      mockVerifyIdToken.mockResolvedValueOnce(mockDecodedToken);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({
        email: 'test@example.com',
        sub: 'user-id-123',
      });
      expect(mockVerifyIdToken).toHaveBeenCalledWith('valid-token');
    });

    it('should handle case when email is not present in token', async () => {
      mockRequest.headers.authorization = 'Bearer valid-token';
      const mockDecodedToken = {
        sub: 'user-id-123',
      };
      mockVerifyIdToken.mockResolvedValueOnce(mockDecodedToken);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({
        email: '',
        sub: 'user-id-123',
      });
    });
  });
});
