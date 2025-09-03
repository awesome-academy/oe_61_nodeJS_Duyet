import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ExecutionContext } from '@nestjs/common';

// Define a type for the mock user object for type safety
type MockUser = { role?: string; email?: string } | undefined;

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  // Helper function to create a mock ExecutionContext
  // FIX: Changed 'user' parameter type from 'any' to the more specific 'MockUser'
  const createMockExecutionContext = (
    user: MockUser,
    requiredRoles?: string[],
  ) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);

    const mockRequest = {
      user,
    };

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
    } as unknown as ExecutionContext;
  };

  // --- Test Case 1: API does not require any roles ---
  it('should return true if no roles are required', () => {
    const context = createMockExecutionContext({ role: 'customer' }, undefined);
    expect(guard.canActivate(context)).toBe(true);
  });

  // --- Test Case 2: User has the required role ---
  it('should return true if the user has the required role', () => {
    const context = createMockExecutionContext({ role: 'admin' }, ['admin']);
    expect(guard.canActivate(context)).toBe(true);
  });

  // --- Test Case 3: User does NOT have the required role ---
  it('should return false if the user does not have the required role', () => {
    const context = createMockExecutionContext({ role: 'customer' }, ['admin']);
    expect(guard.canActivate(context)).toBe(false);
  });

  // --- Test Case 4: API requires one of several roles, and the user has one ---
  it('should return true if the user has one of the required roles', () => {
    const context = createMockExecutionContext({ role: 'staff' }, [
      'admin',
      'staff',
    ]);
    expect(guard.canActivate(context)).toBe(true);
  });

  // --- Test Case 5: API requires one of several roles, but the user has none ---
  it('should return false if the user role is not in the required roles list', () => {
    const context = createMockExecutionContext({ role: 'customer' }, [
      'admin',
      'staff',
    ]);
    expect(guard.canActivate(context)).toBe(false);
  });

  // --- Test Case 6 (Edge Case): User has no role property ---
  it('should return false if the user object has no role property', () => {
    const context = createMockExecutionContext({ email: 'test@test.com' }, [
      'admin',
    ]);
    expect(guard.canActivate(context)).toBe(false);
  });

  // --- Test Case 7 (Edge Case): User object is missing from request ---
  it('should return false if the user object is missing from the request', () => {
    const context = createMockExecutionContext(undefined, ['admin']);
    expect(guard.canActivate(context)).toBe(false);
  });
});
