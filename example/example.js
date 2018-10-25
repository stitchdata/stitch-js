const COMMON_FIELDS = ["default_streams", "ephemeral_token"];

const SCENARIOS = [
  {
    name: "create",
    title: "Create new source",
    invoke: Stitch.addSource,
    fields: new Set([...COMMON_FIELDS, "type"])
  },
  {
    name: "edit",
    title: "Edit existing source",
    invoke: Stitch.editSource,
    fields: new Set([...COMMON_FIELDS, "id"])
  },
  {
    name: "authorize",
    title: "Authorize source",
    invoke: Stitch.authorizeSource,
    fields: new Set([...COMMON_FIELDS, "id"])
  },
  {
    name: "authorize only",
    title: "Authorize source only",
    invoke: Stitch.onlyAuthorizeSource,
    fields: new Set([...COMMON_FIELDS, "id"])
  },
  {
    name: "discover",
    title: "Display source discovery output",
    invoke: Stitch.displayDiscoveryOutputForSource,
    fields: new Set([...COMMON_FIELDS, "id", "discovery_job_name"])
  },
  {
    name: "selectStreams",
    title: "Select streams",
    invoke: Stitch.selectStreamsForSource,
    fields: new Set([...COMMON_FIELDS, "id"])
  }
];

function parseString(value) {
  if (!value || value.length === 0) {
    throw new Error("Field is required.");
  }
  return value;
}

function parseOptionalString(value) {
  if (value && value.length > 0) {
    return value;
  }
}

const FIELD_CONFIG = [
  {
    key: "id",
    name: "Connection id",
    parseInput: value => {
      const parsedValue = parseInt(value, 10);
      if (!value || parsedValue.toString() !== value || parsedValue <= 0) {
        throw new Error("Must be a positive integer.");
      }
      return parsedValue;
    }
  },
  {
    key: "type",
    name: "Connection type",
    parseInput: parseString
  },
  {
    key: "discovery_job_name",
    name: "Discovery job name",
    parseInput: parseString
  },
  {
    key: "ephemeral_token",
    name: "Ephemeral token (optional)",
    parseInput: parseOptionalString
  },
  {
    key: "default_streams",
    name: "Default selections (optional, comma-separated)",
    parseInput: value => {
      if (value && value.length > 0) {
        return value.split(",").reduce((m, s) => {
          m[s.trim()] = true;
          return m;
        }, {});
      }
    }
  }
];

const STATES = {
  NOT_STARTED: "NOT_STARTED",
  APP_OPEN: "APP_OPEN",
  SUCCESS: "SUCCESS",
  FAILURE: "FAILURE"
};

function Form({
  config,
  scenario,
  options,
  disabled,
  onSetOption,
  children,
  onSubmit
}) {
  const fields = config
    .filter(({ key }) => scenario.fields.has(key))
    .map(({ key, name }) => (
      <label key={key}>
        {name}
        <input
          value={options[key] || ""}
          disabled={disabled}
          onChange={e => onSetOption(key, e.target.value)}
        />
      </label>
    ));

  return (
    <form onSubmit={onSubmit} className="container">
      {fields}
      {children}
    </form>
  );
}

class SampleApp extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      scenario: SCENARIOS[0],
      scenarioState: STATES.NOT_STARTED,
      result: null,
      options: {
        type: ""
      }
    };
  }

  start(e) {
    e.preventDefault();

    let sanitizedOptions;
    try {
      sanitizedOptions = FIELD_CONFIG.filter(config => {
        return this.state.scenario.fields.has(config.key);
      }).reduce((options, config) => {
        try {
          options[config.key] = config.parseInput(
            this.state.options[config.key]
          );
        } catch (error) {
          alert(`Error with ${config.name}: ${error.message}`);
          throw error;
        }
        return options;
      }, {});
    } catch (e) {
      return;
    }

    const successCallback = result => {
      this.setState({
        scenarioState: STATES.SUCCESS,
        result: JSON.stringify(result, null, "  ")
      });
    };
    this.successCallback = successCallback;

    const errorCallback = error => {
      this.setState({
        scenarioState: STATES.FAILURE,
        result: `${error.constructor.name}: ${error.message}`
      });
    };
    this.errorCallback = errorCallback;

    this.state.scenario
      .invoke(sanitizedOptions)
      .then(result => {
        if (successCallback === this.successCallback) {
          successCallback(result);
        }
      })
      .catch(error => {
        if (errorCallback === this.errorCallback) {
          errorCallback(error);
        }
      });
    this.setState({
      scenarioState: STATES.APP_OPEN
    });
  }

  onScenarioChanged(e) {
    const scenario = SCENARIOS.find(
      scenario => scenario.name === e.target.value
    );
    if (scenario !== this.state.scenario) {
      this.setState({
        scenario,
        scenarioState: STATES.NOT_STARTED
      });
    }
  }

  render() {
    const { scenario, scenarioState, options, result } = this.state;
    let startButton;
    if (scenarioState !== STATES.APP_OPEN) {
      startButton = (
        <button>
          {scenarioState === STATES.NOT_STARTED ? `Start` : `Restart`}
        </button>
      );
    }
    const scenarioSelector = (
      <select
        value={scenario.name}
        onChange={this.onScenarioChanged.bind(this)}
      >
        {SCENARIOS.map((_scenario, index) => (
          <option value={_scenario.name} key={_scenario.name}>
            {_scenario.title}
          </option>
        ))}
      </select>
    );

    const form = (
      <Form
        config={FIELD_CONFIG}
        scenario={scenario}
        options={options}
        disabled={scenarioState === STATES.APP_OPEN}
        onSetOption={(k, v) =>
          this.setState({ options: { ...options, [k]: v } })
        }
        onSubmit={this.start.bind(this)}
      >
        {startButton}
      </Form>
    );

    let status;
    if (scenarioState === STATES.NOT_STARTED) {
      status = <div className="status status--not-started">Not started</div>;
    } else if (scenarioState === STATES.APP_OPEN) {
      status = (
        <div className="status status--in-progress">Stitch app open</div>
      );
    } else if (scenarioState === STATES.SUCCESS) {
      status = (
        <div className="status status--success">
          <div>{scenario.title.toLowerCase()} succeeded</div>
          <pre className="status__detail">{result}</pre>
        </div>
      );
    } else if (scenarioState === STATES.FAILURE) {
      status = (
        <div className="status status--failure">
          <div>Failed to {scenario.title.toLowerCase()}</div>
          <pre className="status__detail">{result}</pre>
        </div>
      );
    }

    return (
      <div className="container container--primary">
        <h1>Stitch JS Client tester</h1>
        {status}
        <label>
          Scenario:
          {scenarioSelector}
        </label>
        {form}
      </div>
    );
  }
}

ReactDOM.render(<SampleApp />, document.getElementById("root"));
