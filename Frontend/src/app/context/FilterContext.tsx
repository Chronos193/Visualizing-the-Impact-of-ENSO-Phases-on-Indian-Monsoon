import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { ALL } from "../data/constants";
import type { Phase } from "../data/types";

export interface FilterState {
  year: number;
  compareYear: number;
  phase: Phase | typeof ALL;
  state: string | typeof ALL; // state id
  subdivision: string | typeof ALL; // subdivision id
  selectedRegionId: string | null; // map click
  hoveredRegionId: string | null;
  brushRange: [number, number] | null; // ONI series indices
  playbackDay: number;
  isPlaying: boolean;
  compareMode: boolean; // global Year A vs Year B mode
}

type Action =
  | { type: "setYear"; value: number }
  | { type: "setCompareYear"; value: number }
  | { type: "setPhase"; value: Phase | typeof ALL }
  | { type: "setState"; value: string | typeof ALL }
  | { type: "setSubdivision"; value: string | typeof ALL }
  | { type: "selectRegion"; value: string | null }
  | { type: "hoverRegion"; value: string | null }
  | { type: "setBrushRange"; value: [number, number] | null }
  | { type: "setPlaybackDay"; value: number }
  | { type: "togglePlay"; value?: boolean }
  | { type: "toggleCompareMode"; value?: boolean }
  | { type: "reset" };

const initialState: FilterState = {
  year: 2015, // a strong El Niño year — good default story
  compareYear: 2020, // a strong La Niña year — sharp real contrast
  phase: ALL,
  state: ALL,
  subdivision: ALL,
  selectedRegionId: null,
  hoveredRegionId: null,
  brushRange: null,
  playbackDay: 0,
  isPlaying: false,
  compareMode: false,
};

function reducer(state: FilterState, action: Action): FilterState {
  switch (action.type) {
    case "setYear":
      return { ...state, year: action.value };
    case "setCompareYear":
      return { ...state, compareYear: action.value };
    case "setPhase":
      return { ...state, phase: action.value };
    case "setState":
      // Changing state clears any subdivision that no longer belongs.
      return { ...state, state: action.value, subdivision: ALL };
    case "setSubdivision":
      return { ...state, subdivision: action.value };
    case "selectRegion":
      return {
        ...state,
        selectedRegionId: state.selectedRegionId === action.value ? null : action.value,
      };
    case "hoverRegion":
      return { ...state, hoveredRegionId: action.value };
    case "setBrushRange":
      return { ...state, brushRange: action.value };
    case "setPlaybackDay":
      return { ...state, playbackDay: action.value };
    case "togglePlay":
      return { ...state, isPlaying: action.value ?? !state.isPlaying };
    case "toggleCompareMode":
      return { ...state, compareMode: action.value ?? !state.compareMode };
    case "reset":
      return { ...initialState };
    default:
      return state;
  }
}

interface FilterContextValue {
  state: FilterState;
  setYear: (v: number) => void;
  setCompareYear: (v: number) => void;
  setPhase: (v: Phase | typeof ALL) => void;
  setState: (v: string | typeof ALL) => void;
  setSubdivision: (v: string | typeof ALL) => void;
  selectRegion: (v: string | null) => void;
  hoverRegion: (v: string | null) => void;
  setBrushRange: (v: [number, number] | null) => void;
  setPlaybackDay: (v: number) => void;
  togglePlay: (v?: boolean) => void;
  toggleCompareMode: (v?: boolean) => void;
  reset: () => void;
}

const FilterContext = createContext<FilterContextValue | null>(null);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const value = useMemo<FilterContextValue>(
    () => ({
      state,
      setYear: (v) => dispatch({ type: "setYear", value: v }),
      setCompareYear: (v) => dispatch({ type: "setCompareYear", value: v }),
      setPhase: (v) => dispatch({ type: "setPhase", value: v }),
      setState: (v) => dispatch({ type: "setState", value: v }),
      setSubdivision: (v) => dispatch({ type: "setSubdivision", value: v }),
      selectRegion: (v) => dispatch({ type: "selectRegion", value: v }),
      hoverRegion: (v) => dispatch({ type: "hoverRegion", value: v }),
      setBrushRange: (v) => dispatch({ type: "setBrushRange", value: v }),
      setPlaybackDay: (v) => dispatch({ type: "setPlaybackDay", value: v }),
      togglePlay: (v) => dispatch({ type: "togglePlay", value: v }),
      toggleCompareMode: (v) => dispatch({ type: "toggleCompareMode", value: v }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [state],
  );

  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}

export function useFilters(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters must be used within a FilterProvider");
  return ctx;
}
