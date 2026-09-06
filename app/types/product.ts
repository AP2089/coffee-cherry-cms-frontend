import type { PaginatedList } from './api'

export interface CoffeeLocalizedContent {
  name?: string
  country: string
  region: string
  variety?: string
  process: string
  altitude?: string
  description: string
  story: string
  flavorNotes: string[]
}

export type CoffeeWeight = 250 | 500 | 1000

export interface Coffee {
  _id: string
  name: string
  slug: string
  country: string
  region: string
  variety: string
  process: string
  altitude: string
  description: string
  story: string
  flavorNotes: string[]
  price: number
  weights: CoffeeWeight[]
  image: string
  gallery: string[]
  stock: number
  translations?: {
    en?: CoffeeLocalizedContent
  }
  createdAt?: string
  updatedAt?: string
}

export interface CoffeeTextFields {
  name: string
  country: string
  region: string
  variety: string
  process: string
  altitude: string
  description: string
  story: string
  flavorNotes: string[]
}

export interface CoffeeCommerceFields {
  price: number
  stock: number
  weights: CoffeeWeight[]
}

export interface CreateCoffeeInput extends CoffeeTextFields, CoffeeCommerceFields {
  slug: string
  image: string
  gallery?: string[]
}

export type CoffeeList = PaginatedList<Coffee>
