// ============================================================
// palletizing.ts — 单元测试
// ============================================================

import { describe, it, expect } from 'vitest'
import { findOptimalPalletizing } from '../palletizing'
import type { PalletDim, PalletConstraint } from '../types'
import { DEFAULT_PALLET_CONSTRAINT } from '../types'

// ---- Helpers -------------------------------------------------

/** 标准 Euro 托盘 */
const EURO_PALLET: PalletDim = { length: 1200, width: 1000, height: 150 }

// ---- findOptimalPalletizing ----------------------------------

describe('findOptimalPalletizing', () => {
  // ---- Basic correctness ------------------------------------

  it('returns an array (possibly empty), never null or undefined', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)
    expect(Array.isArray(result)).toBe(true)
  })

  it('returns at most 2 solutions (one per orientation)', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('returns 0 solutions when box is larger than pallet in every orientation', () => {
    // Box too large to fit on the pallet in any orientation
    const box = { length: 2000, width: 2000, height: 200 }
    const result = findOptimalPalletizing(box, EURO_PALLET)
    expect(result).toHaveLength(0)
  })

  it('returns solutions sorted by areaUtilization descending', () => {
    // Use a box that likely works in both orientations
    const box = { length: 500, width: 300, height: 200 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    expect(result.length).toBeGreaterThan(0)
    for (let i = 1; i < result.length; i++) {
      expect(result[i].layout.areaUtilization).toBeLessThanOrEqual(
        result[i - 1].layout.areaUtilization,
      )
    }
  })

  // ---- Two orientations --------------------------------------

  it('marks rotated=false when box length aligns with pallet length', () => {
    // 400×200 fits nicely: 3 along length, 5 along width = 15/layer
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    // Orientation A (not rotated) has 3 along length (1200/400)
    const notRotated = result.find((s) => !s.layout.rotated)
    expect(notRotated).toBeDefined()
    expect(notRotated!.layout.alongLength).toBe(3)
    expect(notRotated!.layout.alongWidth).toBe(5)
    expect(notRotated!.layout.boxesPerLayer).toBe(15)
  })

  it('marks rotated=true when box length aligns with pallet width', () => {
    // 200×400 fits: 6 along length (1200/200), 2 along width (1000/400)
    // But since length=200, width=400 — orientation B rotates so
    // box length=200 goes along pallet width=1000, box width=400
    // goes along pallet length=1200 → alongLength=1200/400=3, alongWidth=1000/200=5
    // Wait, let me be more precise.

    // Box: 500×300. Orientation A: 2×3=6/layer (500 along 1200, 300 along 1000)
    // Orientation B (rotated): box length=500 along pallet width=1000,
    //   box width=300 along pallet length=1200 → alongLength=4, alongWidth=2 = 8/layer
    const box = { length: 500, width: 300, height: 200 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    const rotated = result.find((s) => s.layout.rotated)
    expect(rotated).toBeDefined()
    expect(rotated!.layout.rotated).toBe(true)
  })

  it('may return both orientations as separate solutions', () => {
    // Use a box where both orientations are feasible
    const box = { length: 500, width: 300, height: 200 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    // This box should produce solutions for both orientations
    // Orientation A: 1200/500=2, 1000/300=3 → 6/layer
    // Orientation B: 1200/300=4, 1000/500=2 → 8/layer
    expect(result.length).toBe(2)
  })

  // ---- Constraint verification ------------------------------

  it('all solutions respect the overhang limit (maxOverhang=0)', () => {
    const box = { length: 504, width: 399, height: 223 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    for (const sol of result) {
      expect(sol.layout.overhangLength).toBeLessThanOrEqual(0)
      expect(sol.layout.overhangWidth).toBeLessThanOrEqual(0)
    }
  })

  it('allows positive overhang when maxOverhang > 0', () => {
    // Box slightly larger than pallet in one dimension
    const boxBig = { length: 1100, width: 500, height: 200 }
    const resultWithOverhang = findOptimalPalletizing(boxBig, EURO_PALLET, {
      maxHeight: 1500,
      maxWeight: 1000,
      maxOverhang: 50, // allow generous overhang
    })

    // Should still work
    for (const sol of resultWithOverhang) {
      expect(sol.layout.overhangLength).toBeLessThanOrEqual(50)
      expect(sol.layout.overhangWidth).toBeLessThanOrEqual(50)
    }
  })

  it('all solutions respect total height ≤ maxHeight', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    for (const sol of result) {
      expect(sol.layout.totalHeight).toBeLessThanOrEqual(1500)
    }
  })

  it('all solutions respect the weight constraint', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    // Each box weighs 5kg by default
    for (const sol of result) {
      const estimatedWeight = sol.totalBoxes * 5
      expect(estimatedWeight).toBeLessThanOrEqual(1000)
    }
  })

  it('uses custom singleBoxWeightKg for weight calculations', () => {
    const box2 = { length: 500, width: 500, height: 200 }

    // Orientation A: alongLength=2, alongWidth=2, 4/layer
    // With 100kg/box, each layer = 400kg, maxLayersByWeight = floor(1000/400) = 2
    // maxLayersByHeight = floor((1500-150)/200) = 6
    // layers = min(6, 2) = 2
    const result2 = findOptimalPalletizing(
      box2,
      EURO_PALLET,
      DEFAULT_PALLET_CONSTRAINT,
      { singleBoxWeightKg: 100 },
    )

    for (const sol of result2) {
      const totalWeight = sol.totalBoxes * 100
      expect(totalWeight).toBeLessThanOrEqual(1000)
    }
  })

  it('respects a tighter maxHeight constraint', () => {
    const box = { length: 400, width: 200, height: 150 }
    // Pallet 150mm, maxHeight=450, so usable height = 300mm
    // boxHeight=150, maxLayersByHeight = floor(300/150) = 2
    const tightHeightConstraint: PalletConstraint = {
      maxHeight: 450,
      maxWeight: 1000,
      maxOverhang: 0,
    }
    const result = findOptimalPalletizing(box, EURO_PALLET, tightHeightConstraint)

    for (const sol of result) {
      expect(sol.layout.totalHeight).toBeLessThanOrEqual(450)
      expect(sol.layout.layers).toBeLessThanOrEqual(2)
    }
  })

  // ---- Formula consistency ----------------------------------

  it('areaUtilization follows formula: (boxesPerLayer * boxL * boxW) / (palletL * palletW)', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    const palletArea = EURO_PALLET.length * EURO_PALLET.width

    for (const sol of result) {
      const { alongLength, alongWidth, boxesPerLayer, areaUtilization } =
        sol.layout
      // alongLength × alongWidth must equal boxesPerLayer
      expect(alongLength * alongWidth).toBe(boxesPerLayer)

      const expectedUtil =
        (boxesPerLayer * sol.boxOuter.length * sol.boxOuter.width) / palletArea
      expect(areaUtilization).toBeCloseTo(expectedUtil, 10)
    }
  })

  it('totalBoxes equals boxesPerLayer * layers', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    for (const sol of result) {
      expect(sol.totalBoxes).toBe(
        sol.layout.boxesPerLayer * sol.layout.layers,
      )
    }
  })

  it('totalHeight equals pallet.height + layers * boxHeight', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    for (const sol of result) {
      const expectedHeight = EURO_PALLET.height + sol.layout.layers * box.height
      expect(sol.layout.totalHeight).toBe(expectedHeight)
    }
  })

  it('totalProducts equals totalBoxes * productsPerBox when specified', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(
      box,
      EURO_PALLET,
      DEFAULT_PALLET_CONSTRAINT,
      { productsPerBox: 10 },
    )

    for (const sol of result) {
      expect(sol.totalProducts).toBe(sol.totalBoxes * 10)
    }
  })

  it('totalProducts defaults to totalBoxes (productsPerBox=1)', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    for (const sol of result) {
      expect(sol.totalProducts).toBe(sol.totalBoxes)
    }
  })

  it('overhang formulas are computed correctly', () => {
    // Orientation A: box.length along pallet.length = 1200/400=3
    //   overhangLength = (3*400-1200)/2 = 0
    //   box.width along pallet.width = 1000/200=5
    //   overhangWidth = (5*200-1000)/2 = 0
    // Orientation B: box.length along pallet.width = 1000/400=2
    //   overhangWidth = (2*400-1000)/2 = -100
    //   box.width along pallet.length = 1200/200=6
    //   overhangLength = (6*200-1200)/2 = 0
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    for (const sol of result) {
      const { alongLength, alongWidth, overhangLength, overhangWidth, rotated } =
        sol.layout

      if (!rotated) {
        // Orientation A: box length (400) along pallet length (1200)
        expect(overhangLength).toBe((alongLength * 400 - 1200) / 2)
        expect(overhangWidth).toBe((alongWidth * 200 - 1000) / 2)
      } else {
        // Orientation B: box width (200) along pallet length (1200)
        expect(overhangLength).toBe((alongLength * 200 - 1200) / 2)
        expect(overhangWidth).toBe((alongWidth * 400 - 1000) / 2)
      }
    }
  })

  it('volumeUtilization matches areaUtilization for column stacking', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    for (const sol of result) {
      // For simple column stacking, volume = area × layers × boxHeight
      // and pallet volume basis = palletArea × layers × boxHeight,
      // so they simplify to the same ratio.
      expect(sol.volumeUtilization).toBeCloseTo(sol.layout.areaUtilization, 10)
    }
  })

  // ---- Verification case: 504×399×223 on Euro pallet ---------
  //
  //   Orientation A: alongLength=2 (1200/504), alongWidth=2 (1000/399), 4/layer
  //                  overhangLength=-96, overhangWidth=-101, areaUtil=0.6703
  //   Orientation B: alongLength=3 (1200/399), alongWidth=1 (1000/504), 3/layer
  //                  overhangLength=-1.5, overhangWidth=-248, areaUtil=0.5027
  //   Height: 6 layers, orientation A → 24 boxes, orientation B → 18 boxes
  //   Best = orientation A with 24 boxes

  it('verification: 504×399×223 on Euro pallet finds best solution (Orientation A, 4/layer)', () => {
    const box = { length: 504, width: 399, height: 223 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    expect(result.length).toBeGreaterThan(0)

    const best = result[0]
    expect(best.layout.rotated).toBe(false) // Orientation A should be better
    expect(best.layout.alongLength).toBe(2)
    expect(best.layout.alongWidth).toBe(2)
    expect(best.layout.boxesPerLayer).toBe(4)

    // Verify all constraints are satisfied
    expect(best.layout.overhangLength).toBeLessThanOrEqual(0)
    expect(best.layout.overhangWidth).toBeLessThanOrEqual(0)
    expect(best.layout.totalHeight).toBeLessThanOrEqual(1500)

    // 6 layers from height: (1500-150)/223 = 6.05 → 6
    expect(best.layout.layers).toBe(6)
    expect(best.totalBoxes).toBe(24) // 4 × 6
    expect(best.totalProducts).toBe(24) // default 1 product per box
  })

  it('verification: 504×399×223 may produce two orientation solutions', () => {
    const box = { length: 504, width: 399, height: 223 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    // Orientation A: 4/layer, areaUtil ≈ 0.670
    // Orientation B: 3/layer, areaUtil ≈ 0.503
    // Both pass overhang constraints (both have all-negative overhangs)
    // So we should get 2 solutions
    expect(result.length).toBe(2)

    // Sorted by areaUtilization descending
    expect(result[0].layout.areaUtilization).toBeGreaterThanOrEqual(
      result[1].layout.areaUtilization,
    )

    // Verify orientation B layout
    const solB = result[1]
    expect(solB.layout.rotated).toBe(true)
    expect(solB.layout.alongLength).toBe(3)
    expect(solB.layout.alongWidth).toBe(1)
    expect(solB.layout.boxesPerLayer).toBe(3)
    expect(solB.layout.layers).toBe(6)
    expect(solB.totalBoxes).toBe(18)
  })

  // ---- Verification case: 400×200×150 (perfect fit) ---------
  //
  //   Orientation A: alongLength=3, alongWidth=5, 15/layer, areaUtil=1.0
  //   Orientation B: alongLength=6, alongWidth=2, 12/layer, areaUtil=0.8
  //   Height: 9 layers (1500-150)/150 = 9
  //   Best = 135 boxes (15×9), areaUtil=1.0, volumeUtil=1.0

  it('verification: 400×200×150 achieves perfect area utilization (A: 15/layer)', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    const best = result[0]
    expect(best.layout.rotated).toBe(false)
    expect(best.layout.boxesPerLayer).toBe(15)
    expect(best.layout.alongLength).toBe(3)
    expect(best.layout.alongWidth).toBe(5)
    expect(best.layout.areaUtilization).toBeCloseTo(1.0, 10)
    expect(best.layout.layers).toBe(9) // 1350 / 150 = 9
    expect(best.totalBoxes).toBe(135) // 15 × 9
    expect(best.volumeUtilization).toBeCloseTo(1.0, 10)
    expect(best.layout.overhangLength).toBe(0)
    expect(best.layout.overhangWidth).toBe(0)
  })

  // ---- Edge cases -------------------------------------------

  it('returns empty array when box is too large for pallet in all orientations', () => {
    // Both dimensions exceed pallet dimensions
    const box = { length: 1300, width: 1100, height: 200 }
    const result = findOptimalPalletizing(box, EURO_PALLET)
    expect(result).toHaveLength(0)
  })

  it('returns empty array when box height exceeds usable height', () => {
    // Box height (1400) > maxHeight-palletH (1350), so 0 layers
    const box = { length: 400, width: 200, height: 1400 }
    const result = findOptimalPalletizing(box, EURO_PALLET)
    expect(result).toHaveLength(0)
  })

  it('handles a very small box (many per layer, many layers)', () => {
    // Box: 100×100×50 on 1200×1000×150 pallet
    // Orientation A: 12×10=120/layer, areaUtil = 1.0
    // Height: (1500-150)/50 = 27 layers
    // Weight: 5kg×120=600kg/layer, maxLayersByWeight=1
    // → weight-limited to 1 layer
    const box = { length: 100, width: 100, height: 50 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    expect(result.length).toBeGreaterThan(0)
    const best = result[0]
    expect(best.layout.boxesPerLayer).toBeGreaterThanOrEqual(120)
    expect(best.totalBoxes).toBeGreaterThanOrEqual(120)
  })

  it('handles a narrow box that only fits in one orientation', () => {
    // Box: 1100×500×200
    // Orientation A: alongLength=1 (1200/1100), alongWidth=2 (1000/500), 2/layer ✓
    // Orientation B: alongLength=2 (1200/500), alongWidth=0 (1000/1100=0), skip
    const box = { length: 1100, width: 500, height: 200 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    expect(result.length).toBe(1)
    expect(result[0].layout.rotated).toBe(false)
  })

  it('box that fits in neither orientation returns empty', () => {
    // Box too wide for pallet width in both orientations
    const box = { length: 1300, width: 1100, height: 200 }
    const result = findOptimalPalletizing(box, EURO_PALLET)
    expect(result).toHaveLength(0)
  })

  it('handles a cubic box (same dimensions all sides)', () => {
    const box = { length: 200, width: 200, height: 200 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    expect(result.length).toBeGreaterThan(0)
    // Both orientations should yield the same layout
    expect(result.length).toBe(2)
    // Both should have identical areaUtil
    expect(result[0].layout.areaUtilization).toBe(result[1].layout.areaUtilization)
    // But sorted arbitrarily since ties
  })

  it('handles maxHeight exactly at pallet height (no room for layers)', () => {
    const noHeightConstraint: PalletConstraint = {
      maxHeight: 150, // same as pallet height
      maxWeight: 1000,
      maxOverhang: 0,
    }
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET, noHeightConstraint)

    expect(result).toHaveLength(0)
  })

  it('weight limit can restrict layers more than height limit', () => {
    // Use a box that's 200×200×50:
    // alongLength=6, alongWidth=5, 30/layer
    // 30*10=300kg/layer, maxLayersByWeight = floor(1000/300) = 3
    // maxLayersByHeight = floor(1350/50) = 27
    // layers = min(27, 3) = 3
    // totalBoxes = 30*3 = 90, totalWeight = 900kg ≤ 1000 ✓
    const box2 = { length: 200, width: 200, height: 50 }
    const result2 = findOptimalPalletizing(
      box2,
      EURO_PALLET,
      DEFAULT_PALLET_CONSTRAINT,
      { singleBoxWeightKg: 10 },
    )

    for (const sol of result2) {
      const totalWeight = sol.totalBoxes * 10
      expect(totalWeight).toBeLessThanOrEqual(1000)
      // layers should be limited by weight (3), not height (27)
      expect(sol.layout.layers).toBeLessThan(27)
    }
  })

  it('uses DEFAULT_PALLET_CONSTRAINT when no constraint provided', () => {
    const box = { length: 400, width: 200, height: 150 }
    const withDefault = findOptimalPalletizing(box, EURO_PALLET)
    const withExplicit = findOptimalPalletizing(box, EURO_PALLET, DEFAULT_PALLET_CONSTRAINT)

    expect(withDefault.length).toBe(withExplicit.length)
    if (withDefault.length > 0 && withExplicit.length > 0) {
      expect(withDefault[0].layout.areaUtilization).toBe(
        withExplicit[0].layout.areaUtilization,
      )
      expect(withDefault[0].totalBoxes).toBe(withExplicit[0].totalBoxes)
    }
  })

  // ---- Result structure -------------------------------------

  it('every solution has all required fields populated with valid values', () => {
    const box = { length: 400, width: 200, height: 150 }
    const result = findOptimalPalletizing(box, EURO_PALLET)

    for (const sol of result) {
      // boxOuter
      expect(sol.boxOuter).toBeDefined()
      expect(sol.boxOuter.length).toBe(box.length)
      expect(sol.boxOuter.width).toBe(box.width)
      expect(sol.boxOuter.height).toBe(box.height)

      // layout
      expect(sol.layout.alongLength).toBeGreaterThan(0)
      expect(sol.layout.alongWidth).toBeGreaterThan(0)
      expect(sol.layout.boxesPerLayer).toBeGreaterThan(0)
      expect(sol.layout.boxesPerLayer).toBe(
        sol.layout.alongLength * sol.layout.alongWidth,
      )
      expect(sol.layout.layers).toBeGreaterThan(0)
      expect(typeof sol.layout.overhangLength).toBe('number')
      expect(typeof sol.layout.overhangWidth).toBe('number')
      expect(typeof sol.layout.areaUtilization).toBe('number')
      expect(sol.layout.areaUtilization).toBeGreaterThan(0)
      expect(sol.layout.areaUtilization).toBeLessThanOrEqual(1)
      expect(sol.layout.totalHeight).toBeGreaterThan(0)
      expect(typeof sol.layout.rotated).toBe('boolean')

      // totals
      expect(sol.totalBoxes).toBeGreaterThan(0)
      expect(sol.totalBoxes).toBe(
        sol.layout.boxesPerLayer * sol.layout.layers,
      )
      expect(sol.totalProducts).toBeGreaterThan(0)

      // volume
      expect(typeof sol.volumeUtilization).toBe('number')
      expect(sol.volumeUtilization).toBeGreaterThan(0)
      expect(sol.volumeUtilization).toBeLessThanOrEqual(1)
    }
  })
})
