import { config } from "../configuration"
import { deg2rad } from "../utils"

import { Events, Category, Parameter } from "./common"

const sliderConfiguration = [
  {
    category: "body",
    parameter: "x",
    min: -0.5,
    max: 0.5,
    value: 0,
  },
  {
    category: "body",
    parameter: "y",
    min: -0.5,
    max: 0.5,
    value: 0,
  },
  {
    category: "body",
    parameter: "z",
    min: config.hexapod.body.height,
    max: 1,
    value: 0,
  },
  {
    category: "body",
    parameter: "roll",
    min: -deg2rad(35),
    max: deg2rad(35),
    value: 0,
  },
  {
    category: "body",
    parameter: "pitch",
    min: -deg2rad(35),
    max: deg2rad(35),
    value: 0,
  },
  {
    category: "body",
    parameter: "yaw",
    min: -deg2rad(45),
    max: deg2rad(45),
    value: 0,
  },
  {
    category: "joints",
    parameter: "gamma",
    min: -deg2rad(90),
    max: deg2rad(90),
    value: 0,
  },
  {
    category: "joints",
    parameter: "beta",
    min: -deg2rad(90),
    max: deg2rad(90),
    value: 0,
  },
  {
    category: "joints",
    parameter: "alpha",
    min: deg2rad(0),
    max: deg2rad(180),
    value: 0,
  },
  {
    category: "endpoints",
    parameter: "x",
    min: 0.6,
    max: 1.4,
    value: 1,
  },
  {
    category: "endpoints",
    parameter: "y",
    min: -0.5,
    max: 0.5,
    value: 0,
  },
  {
    category: "endpoints",
    parameter: "z",
    min: 0,
    max: 1.3,
    value: 0,
  },
]

export class View extends EventTarget {
  public tabbedView: TabbedView
  private sliderInputHandler: (event: Event) => void
  private lastSlider: null | HTMLInputElement
  private EMA: Map<string, number>

  /**
   * Initializes the View class, setting up UI components
   * (tabbed view, sliders, buttons)
   *
   * Also initializes the Exponential Moving Average (EMA)
   * map.
   */
  constructor() {
    super()
    this.setupTabbedView()
    this.sliderInputHandler = this.handleSliderInput.bind(this)
    this.setupSliders()
    this.setupButtons()
    this.lastSlider = null
    this.EMA = new Map()
  }

  /**
   * Disables the slider input event handler by removing
   * the event listener from the "tab-group".
   */
  disableSliderInputHandler() {
    const target = document.getElementById("tab-group") as HTMLDivElement
    target.removeEventListener("input", this.sliderInputHandler)
  }

  /**
   * Enables the slider input event handler by adding an
   * event listener to the "tab-group".
   */
  enableSliderInputHandler() {
    const target = document.getElementById("tab-group") as HTMLDivElement
    target.addEventListener("input", this.sliderInputHandler)
  }

  /**
   * Initializes and sets up the tabbed view component.
   *
   * Listens for tab switch events and binds the
   * corresponding handler.
   */
  setupTabbedView(): void {
    const tabbedView = new TabbedView()

    tabbedView.addEventListener(Events.TabSwitched, this.handleTabChange.bind(this))

    this.tabbedView = tabbedView
  }

  /**
   * Configures and initializes sliders based on predefined
   * settings.
   *
   * Enables slider input handling and sets default min,
   * max, and value properties.
   *
   * Joint and endpoint sliders are initially disabled
   * until a selection is made.
   */
  setupSliders(): void {
    this.enableSliderInputHandler()

    // Configure the sliders
    sliderConfiguration.forEach((item) => {
      const slider = document.querySelector(
        `input[data-category=${item.category}][data-parameter=${item.parameter}]`
      ) as HTMLInputElement

      slider.min = String(item.min)
      slider.max = String(item.max)

      // slider.value = String(item.value);
      slider.value = String(0)
      //   slider.step = String(0.01);

      // Joint angle and endpoint sliders are disabled until a leg/leg group is selected.
      slider.disabled = item.category === "joints" || item.category === "endpoints" ? true : false
    })
  }

  /**
   * Sets up event listeners for button clicks within each
   * tab's button container.
   *
   * Listens for user interactions with leg selection
   * buttons.
   */
  setupButtons(): void {
    const buttonsGrid = document.querySelectorAll(".button-grid")

    // Listen for button clicks on the top-level button container for each tab.
    buttonsGrid.forEach((grid) => {
      grid.addEventListener("click", this.handleButtonClick.bind(this))
    })

    const resetButton = document.getElementById("reset-button") as HTMLDivElement
    resetButton.style.opacity = "1"

    resetButton.addEventListener("click", () => {
      this.dispatchEvent(new CustomEvent(Events.ResetHexapod))
    })

    resetButton.addEventListener("touchstart", function () {
      resetButton.setAttribute("active", "active")
    })

    resetButton.addEventListener("touchend", function () {
      resetButton.removeAttribute("active")
    })
  }

  /**
   * Sets the value of a specified slider based on category
   * and parameter.
   *
   * @param {Category} category - The category of the
   * slider (e.g., "joints", "endpoints").
   * @param {Parameter} parameter - The parameter
   * associated with the slider.
   * @param {string} value - The new value to set for the
   * slider.
   */
  setSliderValue(category: Category, parameter: Parameter, value: string) {
    const slider = document.querySelector(
      `input[data-category=${category}][data-parameter=${parameter}]`
    ) as HTMLInputElement
    slider.value = value

    const key = `${category}_${parameter}`
    this.EMA.set(key, Number(value))
  }

  /**
   * Enables all sliders within a given category, allowing
   * user interaction.
   *
   * @param {Category} category - The category of sliders
   * to enable.
   */
  enableSliders(category: Category) {
    const sliders = document.querySelectorAll(`input[data-category=${category}]`) as NodeListOf<HTMLInputElement>

    sliders.forEach((slider: HTMLInputElement) => {
      slider.disabled = false
    })
  }

  /**
   * Disables all sliders within a given category and
   * deselects the current selection.
   *
   * @param {Category} category - The category of sliders
   * to disable.
   */
  disableSliders(category: Category) {
    const currentSelected = document.querySelector(".icon-button[selected]")
    currentSelected?.removeAttribute("selected")

    const sliders = document.querySelectorAll(`input[data-category=${category}]`) as NodeListOf<HTMLInputElement>

    sliders.forEach((slider: HTMLInputElement) => {
      slider.blur()
      slider.disabled = true
    })
  }

  /**
   * Handles tab switch events, dispatching a custom event
   * to notify other components.
   *
   * @param {Event} event - The tab switch event containing
   * relevant details.
   */
  handleTabChange(event: Event): void {
    const detail = (<CustomEvent>event).detail

    event.stopImmediatePropagation()

    this.dispatchEvent(
      new CustomEvent(Events.TabSwitched, {
        detail: detail,
      })
    )
  }

  /**
   * Updates the slider value using an Exponential Moving
   * Average (EMA) to smooth sudden large changes in input
   * values.
   *
   * Dispatches a custom event with the updated slider
   * value.
   */
  updateSlider() {
    const target = this.lastSlider as HTMLInputElement
    const category = target.dataset.category
    const parameter = target.dataset.parameter

    let value = Number(target.value)

    const key = `${category}_${parameter}`

    // Calculate the Exponential Moving Average (EMA) to
    // handle sudden big jumps in the input values from
    // the slider being moved too quickly.
    if (this.EMA.has(key)) {
      const period = 5
      const alpha = 2 / (period + 1)
      let EMA = this.EMA.get(key)!
      EMA = alpha * value + (1 - alpha) * EMA
      value = EMA
      this.EMA.set(key, EMA)
    } else {
      this.EMA.set(key, Number(value))
    }

    this.dispatchEvent(
      new CustomEvent(Events.SliderInput, {
        detail: {
          source: "user",
          category: category,
          parameter: parameter,
          value: value,
        },
      })
    )

    this.lastSlider = null
  }

  /**
   * Handles user input on sliders. Prevents duplicate
   * event handling and ensures updates are synchronized
   * with the browser repaint cycle.
   *
   * @param {Event} event - The input event triggered by
   * slider interaction.
   */
  handleSliderInput(event: Event): void {
    const target = event.target as HTMLInputElement
    if (target.type !== "range") return

    event.stopImmediatePropagation()

    // Synchronize slider input event dispatch with the
    // browser repaint.

    if (this.lastSlider) return

    this.lastSlider = target

    requestAnimationFrame(this.updateSlider.bind(this))
  }

  /**
   * Handles button clicks, specifically for leg selection
   * buttons.
   *
   * Updates the selected button state and dispatches an
   * event with the selected legs.
   *
   * @param {Event} event - The click event triggered by a
   * button interaction.
   */
  handleButtonClick(event: Event): void {
    const target = event.target as HTMLImageElement

    // Only handle click events on leg selection buttons
    if (!(target.dataset.category && target.dataset.legs)) {
      return
    }

    event.stopImmediatePropagation()

    const currentSelected = document.querySelector(".icon-button[selected]")
    currentSelected?.removeAttribute("selected")
    target.setAttribute("selected", "selected")

    this.dispatchEvent(
      new CustomEvent(Events.LegSelectionChanged, {
        detail: {
          value: JSON.parse(target.dataset.legs as string),
          category: target.dataset.category as string,
        },
      })
    )
  }

  /**
   * Switches the tabbed view to the specified category.
   *
   * @param category - The tabbed view category to switch
   * to. Can be: "body", "joints", or "endpoints"
   */
  setTab(category: Category) {
    this.tabbedView.category = category
  }
}

class TabbedView extends EventTarget {
  /**
   * The container element holding all tab content.
   */
  public tabGroup: HTMLElement

  /**
   * Collection of tab elements.
   */
  private tabs: HTMLCollectionOf<HTMLElement>
  /**
   * Collection of tab buttons that switch between tabs.
   */
  private buttons: NodeListOf<HTMLLIElement>

  /**
   * Index of the previously selected tab.
   */
  public previousTabIndex: number
  /**
   * Name of the previously selected tab.
   */
  public previousTabName: string
  /**
   * Index of the currently selected tab.
   */
  public currentTabIndex: number
  /**
   * Name of the currently selected tab.
   */
  public currentTabName: string

  constructor() {
    super()
    // Get the tab container element
    this.tabGroup = document.getElementById("tab-group")!

    // Get the child elements (tabs) of the tab container
    this.tabs = this.tabGroup.children as HTMLCollectionOf<HTMLElement>

    // Get all tab buttons
    this.buttons = document.getElementById("tab-buttons")!.querySelectorAll(".tab-button")

    // Initialize tab tracking variables
    this.previousTabIndex = -1
    this.previousTabName = "null"
    this.currentTabIndex = -1
    this.currentTabName = "null"

    // Register event listeners for tab switching
    this.registerEventListeners()
  }

  /**
   * Sets the active category by programmatically clicking the respective tab button.
   * @param {Category} value - The category to switch to.
   */
  set category(value: Category) {
    if (value === "body") {
      this.buttons[0].click()
    } else if (value === "joints") {
      this.buttons[1].click()
    } else if (value === "endpoints") {
      this.buttons[2].click()
    } else if (value === "about") {
      this.buttons[3].click()
    }
  }

  /**
   * Registers event listeners for handling tab switching.
   */
  registerEventListeners(): void {
    document.getElementById("tab-buttons")!.addEventListener("click", this.onClickTabButton.bind(this))
  }

  /**
   * Handles the click event on a tab button and switches
   * to the corresponding tab.
   *
   * @param {Event} event - The click event triggered by a
   * tab button.
   */
  onClickTabButton(event: Event): void {
    const target = event.target as HTMLElement

    // Get the index of the newly selected tab
    const newIndex = Number(target.dataset.index)

    // Prevent unnecessary re-selection of the current tab
    if (newIndex === this.currentTabIndex) return

    // Get references to old and new tabs and buttons
    const oldTab = this.tabs[this.currentTabIndex]
    const newTab = this.tabs[newIndex]
    const oldButton = this.buttons[this.currentTabIndex]
    const newButton = this.buttons[newIndex]

    // Ensure the new tab exists before proceeding
    if (!newTab) return

    // Fade out the old tab if it exists
    if (oldTab) {
      oldTab.style.opacity = "0"
    }

    // Remove selection indicator from the previous button
    if (oldButton) {
      oldButton.removeAttribute("selected")
      this.previousTabName = oldButton.innerText.toLowerCase()
    }

    // Mark the new button as selected
    if (newButton) {
      newButton.setAttribute("selected", "selected")
      this.currentTabName = newButton.innerText.toLowerCase()
    }

    // Smoothly scroll the new tab into view and make it visible
    newTab.scrollIntoView({ behavior: "smooth", block: "start" })
    newTab.style.opacity = "1"

    // Update tracking indices
    this.previousTabIndex = this.currentTabIndex
    this.currentTabIndex = newIndex

    this.dispatchEvent(
      new CustomEvent(Events.TabSwitched, {
        detail: {
          value: this.currentTabName,
        },
      })
    )
  }
}
