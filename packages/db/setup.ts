import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

async function setupDatabase() {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  console.log('🚀 Setting up database with direct cloud connection...')
  console.log('📡 Connecting to:', connectionString.replace(/\/\/[^@]+@/, '//***:***@'))

  // Create connection with better timeout settings for cloud connections
  const client = postgres(connectionString, { 
    max: 1,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: connectionString.includes('localhost') ? false : 'require'
  })

  try {
    // Test connection first
    console.log('🔍 Testing database connection...')
    await client`SELECT 1 as test`
    console.log('✅ Database connection successful!')

    // Initialize Drizzle with schema
    const db = drizzle(client, { schema })

    // Create tables using Drizzle schema introspection
    console.log('📦 Creating database schema...')
    
    // Create users table
    await client`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create subscriptions table
    await client`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id SERIAL PRIMARY KEY,
        user_id SERIAL REFERENCES users(id),
        stripe_id TEXT NOT NULL,
        status TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create products table
    await client`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        currency TEXT DEFAULT 'usd',
        stripe_product_id TEXT,
        stripe_price_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create index on stripe_product_id
    await client`
      CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id ON products(stripe_product_id)
    `
    
    // Create orders table
    await client`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        product_id INTEGER REFERENCES products(id) NOT NULL,
        stripe_payment_intent_id TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL,
        customer_email TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        is_provisional BOOLEAN DEFAULT false,
        provisional_created_at TIMESTAMP,
        sync_attempts INTEGER DEFAULT 0,
        last_sync_attempt TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    
    // Create indexes for orders table
    await client`
      CREATE INDEX IF NOT EXISTS idx_orders_stripe_payment_intent_id ON orders(stripe_payment_intent_id)
    `
    await client`
      CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id)
    `
    await client`
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)
    `
    await client`
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at)
    `
    
    console.log('✅ Database schema created successfully!')

    // Close client connection
    await client.end()

    // Run simple seeding with a new connection
    console.log('🌱 Running database seeding...')
    const seedClient = postgres(connectionString, { 
      max: 1,
      idle_timeout: 30,
      connect_timeout: 10,
      ssl: connectionString.includes('localhost') ? false : 'require'
    })

    try {
      // Initialize Drizzle for seeding
      const db = drizzle(seedClient, { schema })

      // Check if products already exist to avoid duplicate seeding
      const existingProducts = await seedClient`SELECT id FROM products LIMIT 1`
      if (existingProducts.length > 0) {
        console.log('📋 Products already exist, skipping seeding')
      } else {
        // Insert sample products
        await seedClient`
          INSERT INTO products (name, description, price, currency) VALUES
          ('Premium Widget', 'A high-quality widget perfect for your needs', 2999, 'usd'),
          ('Deluxe Gadget', 'The ultimate gadget with advanced features', 4999, 'usd'),
          ('Basic Tool', 'Essential tool for everyday use', 1499, 'usd'),
          ('AssistGenie', 'AI-powered assistant for productivity and automation', 1000, 'hkd')
          ON CONFLICT DO NOTHING
        `
        console.log('✅ Sample products created')
      }
    } finally {
      await seedClient.end()
    }
    
    console.log('✅ Database seeding completed!')

  } catch (error) {
    console.error('❌ Database setup failed:', error)
    console.error('Error details:', error)
    await client.end()
    process.exit(1)
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      console.log('🎉 Database setup completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error)
      process.exit(1)
    })
}

export { setupDatabase }
