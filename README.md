# Freshair

![Freshair](public/opengraph.jpg)

Freshair is an open-source property management platform that helps Airbnb hosts take control of their rental business. Import your Airbnb listings, connect directly with guests, and manage your properties—all while keeping your data yours.

## Features

- 🏠 **One-Click Airbnb Import**: Seamlessly import your existing Airbnb listings
- 💬 **Direct Guest Communication**: Connect with guests without platform restrictions
- 🔄 **Real-Time Sync**: Keep your listing information up to date automatically
- 📊 **Custom Dashboard**: Track performance, bookings, and guest interactions
- 🎨 **Self-Hostable**: Deploy on your own infrastructure and customize as needed
- 💰 **Fee-Free Bookings**: Accept direct bookings without platform fees

## Getting Started

### Prerequisites

- Bun 1.1.34 or later
- PostgreSQL 15.x or later
- Clerk account for authentication
- Postmark account for email notifications
- Mapbox account for location features

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# App
VERCEL_URL=localhost:3000
WEBHOOK_SECRET=your_webhook_secret

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/freshair

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Email
POSTMARK_API_TOKEN=your_postmark_api_token
FROM_EMAIL=your_from_email

# Maps
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### Installation

1. Clone the repository:
```bash
git clone https://github.com/bjornpagen/freshair.git
cd freshair
```

2. Install dependencies:
```bash
bun install
```

3. Set up the database:
```bash
bun drizzle-kit push
```

4. Start the development server:
```bash
bun dev
```

Visit `http://localhost:3000` to see the application.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Authentication**: Clerk
- **Database**: PostgreSQL with Drizzle ORM
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Maps**: Mapbox GL
- **Email**: Postmark
- **Deployment**: Vercel

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the BSD Zero Clause License (0BSD) - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [shadcn/ui](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)
- Fonts by Adobe Typekit (Neue Haas Grotesk)
