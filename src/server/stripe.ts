import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
    // We throw error only in production, or handle it gracefully
    console.warn('STRIPE_SECRET_KEY is not defined in environment variables')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover', // Updated to match expected types
    typescript: true,
})
