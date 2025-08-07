# NestJS Template

A comprehensive NestJS template with a modern tech stack and best practices setup.

This template provides a production-ready foundation for building scalable and maintainable backend applications using NestJS. It implements hexagonal architecture (ports and adapters) to ensure clean separation of concerns and domain-driven design principles. The template comes pre-configured with Prisma ORM for database operations, JWT-based authentication, comprehensive testing setup, and Docker containerization for consistent development and deployment environments.

## Features

- **Hexagonal Architecture** - Clean, maintainable code structure with domain-driven design
- **Prisma ORM** - Type-safe database access with migrations support
- **Authentication** - JWT-based auth system with sign-up and sign-in endpoints
- **JWT** - JSON Web Token implementation for secure authentication
- **Testing** - Jest configuration for unit and e2e tests with code coverage
- **Linting** - ESLint with modern config setup
- **Git Hooks** - Husky for running tests and linting before commits
- **Docker** - Containerization for both development and testing environments

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ pnpm install
```

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```
