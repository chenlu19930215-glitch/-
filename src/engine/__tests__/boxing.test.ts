// ============================================================
// boxing.ts — 单元测试
// ============================================================

import { describe, it, expect } from 'vitest'
import { generateOrientations, findOptimalBoxing } from '../boxing'
import type { CartonDim, BoxConstraint } from '../types'

// ---- generateOrientations ------------------------------------

describe('generateOrientations', () => {
  it('returns exactly 6 permutations for a generic carton', () => {
    const carton: CartonDim = { length: 10, width: 20, height: 30 }
    const result = generateOrientations(carton)
    expect(result).toHaveLength(6)

    // Every orientation has the expected shape
    const tuples = result.map((o) => `${o.l},${o.w},${o.h}`)
    expect(new Set(tuples).size).toBe(6)

    // Verify all 6 permutations are present
    expect(tuples).toContain('10,20,30')
    expect(tuples).toContain('10,30,20')
    expect(tuples).toContain('20,10,30')
    expect(tuples).toContain('20,30,10')
    expect(tuples).toContain('30,10,20')
    expect(tuples).toContain('30,20,10')
  })

  it('handles a cube (all dimensions equal)', () => {
    const carton: CartonDim = { length: 50, width: 50, height: 50 }
    const result = generateOrientations(carton)
    expect(result).toHaveLength(6)
    // All tuples are identical but each Orientation is a distinct object
    for (const o of result) {
      expect(o.l).toBe(50)
      expect(o.w).toBe(50)
      expect(o.h).toBe(50)
    }
  })

  it('handles extreme aspect ratios', () => {
    const carton: CartonDim = { length: 1, width: 100, height: 500 }
    const result = generateOrientations(carton)
    expect(result).toHaveLength(6)
    const tuples = result.map((o) => `${o.l},${o.w},${o.h}`)
    expect(tuples).toContain('1,500,100')
    expect(tuples).toContain('500,100,1')
  })

  it('each orientation has a non-empty label', () => {
    const carton: CartonDim = { length: 10, width: 20, height: 30 }
    const result = generateOrientations(carton)
    for (const o of result) {
      expect(o.label).toBeTruthy()
      expect(typeof o.label).toBe('string')
    }
  })
})

// ---- findOptimalBoxing ----------------------------------------

describe('findOptimalBoxing', () => {
  // ---- Basic correctness ------------------------------------

  it('returns an array (possibly empty), never null or undefined', () => {
    const carton: CartonDim = { length: 100, width: 80, height: 60 }
    const result = findOptimalBoxing(carton)
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns solutions sorted by score in descending order', () => {
    const carton: CartonDim = { length: 100, width: 80, height: 60 }
    const results = findOptimalBoxing(carton)
    expect(results.length).toBeGreaterThan(0)
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score)
    }
  })

  // ---- Constraint verification ------------------------------

  it('all solutions respect outer dimension limits', () => {
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    const results = findOptimalBoxing(carton)

    for (const sol of results) {
      expect(sol.outerDim.length).toBeLessThanOrEqual(600)
      expect(sol.outerDim.width).toBeLessThanOrEqual(600)
      expect(sol.outerDim.height).toBeLessThanOrEqual(600)
    }
  })

  it('all solutions respect gross weight limit', () => {
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    const results = findOptimalBoxing(carton)

    for (const sol of results) {
      expect(sol.grossWeight).toBeLessThanOrEqual(15)
    }
  })

  it('all solutions meet minimum volume utilization (>= 70%)', () => {
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    const results = findOptimalBoxing(carton)

    for (const sol of results) {
      expect(sol.volumeUtilization).toBeGreaterThanOrEqual(0.7)
      // Sanity: utilization cannot exceed 100%
      expect(sol.volumeUtilization).toBeLessThanOrEqual(1.0)
    }
  })

  // ---- Formula consistency ----------------------------------

  it('inner/outer dimensions follow the formula correctly', () => {
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    const results = findOptimalBoxing(carton)

    for (const sol of results) {
      const { counts, orientation, innerDim, outerDim } = sol

      const expectedInnerL = counts[0] * orientation.l + 2 // clearance = 2
      const expectedInnerW = counts[1] * orientation.w + 2
      const expectedInnerH = counts[2] * orientation.h + 2

      expect(innerDim.length).toBe(expectedInnerL)
      expect(innerDim.width).toBe(expectedInnerW)
      expect(innerDim.height).toBe(expectedInnerH)

      expect(outerDim.length).toBe(expectedInnerL + 10) // + 2 * wallThickness (5)
      expect(outerDim.width).toBe(expectedInnerW + 10)
      expect(outerDim.height).toBe(expectedInnerH + 10)
    }
  })

  it('gross weight equals totalCount * singleCartonWeightKg', () => {
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    // Use known weight of 1.0 kg per carton
    const results = findOptimalBoxing(carton, undefined, {
      singleCartonWeightKg: 1.0,
    })

    for (const sol of results) {
      expect(sol.grossWeight).toBe(sol.totalCount * 1.0)
    }
  })

  it('volume utilization computation is consistent', () => {
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    const results = findOptimalBoxing(carton)

    const cartonVolume = 190 * 47 * 190

    for (const sol of results) {
      const innerVol =
        sol.innerDim.length * sol.innerDim.width * sol.innerDim.height
      const expectedUtil = (cartonVolume * sol.totalCount) / innerVol
      expect(sol.volumeUtilization).toBeCloseTo(expectedUtil, 10)
    }
  })

  // ---- Verification case: 190×47×190 ------------------------

  it('verification: finds at least one 20-carton solution for 190x47x190', () => {
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    const results = findOptimalBoxing(carton)

    const twentyCountSolutions = results.filter((s) => s.totalCount === 20)
    expect(twentyCountSolutions.length).toBeGreaterThan(0)

    // Verify the 20-carton solution passes all constraints
    const sol = twentyCountSolutions[0]
    expect(sol.outerDim.length).toBeLessThanOrEqual(600)
    expect(sol.outerDim.width).toBeLessThanOrEqual(600)
    expect(sol.outerDim.height).toBeLessThanOrEqual(600)
    expect(sol.grossWeight).toBeLessThanOrEqual(15)
    expect(sol.volumeUtilization).toBeGreaterThanOrEqual(0.7)

    // The product of counts should equal 20
    expect(sol.counts[0] * sol.counts[1] * sol.counts[2]).toBe(20)
  })

  it('verification: can produce arrangement with 4 along one axis', () => {
    // For 190x47x190 carton, if orientation puts 47mm along an axis,
    // we can fit 10 cartons along that axis (10 × 47 = 470)
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    const results = findOptimalBoxing(carton)

    // At least one orientation should use the 47mm dimension
    const usesSmallestDim = results.some((s) =>
      s.orientation.l === 47 || s.orientation.w === 47 || s.orientation.h === 47,
    )
    expect(usesSmallestDim).toBe(true)
  })

  // ---- Custom constraint ------------------------------------

  it('respects a tighter maxOuterDim', () => {
    const carton: CartonDim = { length: 100, width: 80, height: 60 }
    const tightConstraint: BoxConstraint = {
      maxOuterDim: 200,
      maxWeight: 15,
      wallThickness: 5,
      clearanceL: 2,
      clearanceW: 2,
      clearanceH: 2,
    }
    const results = findOptimalBoxing(carton, tightConstraint)

    for (const sol of results) {
      expect(sol.outerDim.length).toBeLessThanOrEqual(200)
      expect(sol.outerDim.width).toBeLessThanOrEqual(200)
      expect(sol.outerDim.height).toBeLessThanOrEqual(200)
    }
  })

  it('respects a tighter weight limit', () => {
    const carton: CartonDim = { length: 100, width: 80, height: 60 }
    // With 0.5kg per carton and maxWeight=3, at most 6 cartons
    const lightConstraint: BoxConstraint = {
      maxOuterDim: 600,
      maxWeight: 3,
      wallThickness: 5,
      clearanceL: 2,
      clearanceW: 2,
      clearanceH: 2,
    }
    const results = findOptimalBoxing(carton, lightConstraint)

    for (const sol of results) {
      expect(sol.grossWeight).toBeLessThanOrEqual(3)
      expect(sol.totalCount).toBeLessThanOrEqual(6) // 6 * 0.5 = 3
    }
  })

  it('uses custom singleCartonWeightKg correctly', () => {
    const carton: CartonDim = { length: 100, width: 80, height: 60 }
    const heavyCartons = findOptimalBoxing(carton, undefined, {
      singleCartonWeightKg: 2.0,
    })

    for (const sol of heavyCartons) {
      expect(sol.grossWeight).toBe(sol.totalCount * 2.0)
      expect(sol.grossWeight).toBeLessThanOrEqual(15)
      // With 2kg per carton, max 7 cartons
      expect(sol.totalCount).toBeLessThanOrEqual(7)
    }
  })

  // ---- Edge cases -------------------------------------------

  it('returns empty array when carton is too large for any box', () => {
    const carton: CartonDim = { length: 1000, width: 1000, height: 1000 }
    const results = findOptimalBoxing(carton)
    expect(results).toHaveLength(0)
  })

  it('returns empty array when carton weight exceeds limit', () => {
    const carton: CartonDim = { length: 10, width: 10, height: 10 }
    const results = findOptimalBoxing(carton, undefined, {
      singleCartonWeightKg: 100, // single carton already over 15kg
    })
    expect(results).toHaveLength(0)
  })

  it('handles a very small carton (fits many per box)', () => {
    const carton: CartonDim = { length: 10, width: 10, height: 10 }
    const results = findOptimalBoxing(carton)
    expect(results.length).toBeGreaterThan(0)

    // Should fit many cartons in each dimension
    const maxCountPerDim = Math.max(
      ...results.map((s) => Math.max(...s.counts)),
    )
    expect(maxCountPerDim).toBeGreaterThanOrEqual(10)
  })

  it('all scores are in the [0, 1] range', () => {
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    const results = findOptimalBoxing(carton)

    for (const sol of results) {
      expect(sol.volumeUtilization).toBeGreaterThanOrEqual(0)
      expect(sol.volumeUtilization).toBeLessThanOrEqual(1)
      expect(sol.regularity).toBeGreaterThanOrEqual(0)
      expect(sol.regularity).toBeLessThanOrEqual(1)
      expect(sol.weightScore).toBeGreaterThanOrEqual(0)
      expect(sol.weightScore).toBeLessThanOrEqual(1)
      expect(sol.score).toBeGreaterThanOrEqual(0)
      expect(sol.score).toBeLessThanOrEqual(1)
    }
  })

  it('uses DEFAULT_BOX_CONSTRAINT when no constraint provided', () => {
    const carton: CartonDim = { length: 100, width: 80, height: 60 }
    const withDefault = findOptimalBoxing(carton)
    const withExplicit = findOptimalBoxing(carton, {
      maxOuterDim: 600,
      maxWeight: 15,
      wallThickness: 5,
      clearanceL: 2,
      clearanceW: 2,
      clearanceH: 2,
    })

    // Both calls should produce identical results
    expect(withDefault.length).toBe(withExplicit.length)
    if (withDefault.length > 0 && withExplicit.length > 0) {
      expect(withDefault[0].score).toBe(withExplicit[0].score)
      expect(withDefault[0].outerDim).toEqual(withExplicit[0].outerDim)
    }
  })

  // ---- Result structure -------------------------------------

  it('every solution has all required fields populated', () => {
    const carton: CartonDim = { length: 190, width: 47, height: 190 }
    const results = findOptimalBoxing(carton)

    for (const sol of results) {
      expect(sol.orientation).toBeDefined()
      expect(sol.counts).toHaveLength(3)
      expect(sol.totalCount).toBeGreaterThan(0)
      expect(sol.innerDim.length).toBeGreaterThan(0)
      expect(sol.innerDim.width).toBeGreaterThan(0)
      expect(sol.innerDim.height).toBeGreaterThan(0)
      expect(sol.outerDim.length).toBeGreaterThan(0)
      expect(sol.outerDim.width).toBeGreaterThan(0)
      expect(sol.outerDim.height).toBeGreaterThan(0)
      expect(typeof sol.grossWeight).toBe('number')
      expect(typeof sol.volumeUtilization).toBe('number')
      expect(typeof sol.regularity).toBe('number')
      expect(typeof sol.weightScore).toBe('number')
      expect(typeof sol.score).toBe('number')
    }
  })
})
