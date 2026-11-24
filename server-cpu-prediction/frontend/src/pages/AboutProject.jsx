import { Cpu, Database, BarChart3, GitBranch, Layers, AlertCircle, Rocket, Clock } from 'lucide-react'

function Section({ icon: Icon, title, children, color = 'text-primary' }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-blue-900/30 flex items-center justify-center">
          <Icon size={17} className={color} />
        </div>
        <h2 className="text-text-primary font-semibold">{title}</h2>
      </div>
      <div className="text-text-secondary text-sm leading-relaxed space-y-2">{children}</div>
    </div>
  )
}

export default function AboutProject() {
  return (
    <div className="space-y-5 max-w-5xl">
      {/* Header */}
      <div className="card border-blue-800/50 bg-blue-900/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-primary/20 border border-primary/30 rounded-xl flex items-center justify-center shrink-0">
            <Cpu size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-text-primary font-bold text-xl">Server CPU Temperature Prediction</h1>
            <p className="text-text-secondary text-sm mt-1">Machine Learning · Computer Science & Engineering · Regression Analysis</p>
            <p className="text-text-secondary text-xs mt-2">
              Dataset: server_cpu_dataset_nonlinear_6000_v2.csv · 6,000 Records · 7 Columns
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Problem Statement */}
        <Section icon={AlertCircle} title="Problem Statement" color="text-danger">
          <p>
            Modern data centers must maintain server CPU temperatures within safe operating bounds to prevent
            thermal throttling, hardware damage, and unplanned downtime. Manual monitoring is insufficient
            at scale.
          </p>
          <p>
            This project addresses the need for <strong className="text-text-primary">predictive thermal monitoring</strong> using
            machine learning regression models to estimate CPU core temperature from real-time hardware telemetry,
            enabling proactive cooling and load management.
          </p>
        </Section>

        {/* Objectives */}
        <Section icon={Rocket} title="Project Objectives" color="text-success">
          <ul className="space-y-1.5">
            {[
              'Predict CPU temperature from 6 hardware telemetry features',
              'Compare Linear Regression, Decision Tree, and Random Forest',
              'Engineer derived features (Power_Load, Workload) to improve accuracy',
              'Evaluate using R², RMSE, MSE, and MAPE on a 30% held-out test set',
              'Validate generalization via 5-fold cross-validation',
              'Deploy an interactive web dashboard for live predictions',
            ].map((o, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-success mt-0.5 text-xs">▸</span> {o}
              </li>
            ))}
          </ul>
        </Section>

        {/* Dataset */}
        <Section icon={Database} title="Dataset Description" color="text-accent">
          <p><strong className="text-text-primary">File:</strong> server_cpu_dataset_nonlinear_6000_v2.csv</p>
          <p><strong className="text-text-primary">Records:</strong> 6,000 (5,958 after IQR outlier filtering)</p>
          <p><strong className="text-text-primary">Target:</strong> Temperature (°C) — continuous regression target</p>
          <div className="mt-3 space-y-1">
            {[
              ['CPU_Utilization', '10% – 100%', 'Percentage of CPU capacity in use'],
              ['Memory_Usage', '20% – 95%', 'RAM utilization percentage'],
              ['Clock_Speed', '1.5 – 4.0 GHz', 'Active CPU clock frequency'],
              ['Ambient_Temperature', '15°C – 40°C', 'Chassis intake temperature'],
              ['Voltage', '0.9 – 1.5 V', 'Core operating voltage'],
              ['Current', '5.0 – 40.0 A', 'Current drawn by processor'],
            ].map(([name, range, desc]) => (
              <div key={name} className="flex gap-2 text-xs">
                <span className="text-primary font-mono w-36 shrink-0">{name}</span>
                <span className="text-text-secondary w-24 shrink-0">{range}</span>
                <span className="text-text-secondary">{desc}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Preprocessing */}
        <Section icon={Layers} title="Data Preprocessing" color="text-warning">
          <ul className="space-y-1.5">
            {[
              'Missing value imputation using column means (0 missing values in dataset)',
              'Feature Engineering: Power_Load = Voltage × Current (Watts)',
              'Feature Engineering: Workload = CPU_Utilization × Memory_Usage',
              'IQR outlier filtering (removed 42 extreme rows / 0.7% of data)',
              '70/30 Train-Test split (random_state=42) → 4,170 train / 1,788 test',
              'StandardScaler fitted on training data only (no data leakage)',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-warning mt-0.5 text-xs">▸</span> {s}
              </li>
            ))}
          </ul>
        </Section>

        {/* ML Algorithms */}
        <Section icon={GitBranch} title="ML Algorithms" color="text-primary">
          <div className="space-y-3">
            {[
              {
                name: 'Linear Regression',
                desc: 'Ordinary Least Squares baseline. R²≈0.682, RMSE≈33.7°C. Fails to capture non-linear interactions.',
              },
              {
                name: 'Decision Tree (Shallow Baseline)',
                desc: 'max_depth=2, min_samples_leaf=40. R²≈0.834, RMSE≈24.4°C. Interpretable but limited capacity.',
              },
              {
                name: 'Random Forest ✅ Best',
                desc: '300 estimators, max_depth=8, max_features=sqrt. R²≈0.963, RMSE≈11.5°C. Best generalization.',
              },
            ].map(m => (
              <div key={m.name}>
                <p className="text-text-primary font-medium text-xs">{m.name}</p>
                <p>{m.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Metrics */}
        <Section icon={BarChart3} title="Evaluation Metrics" color="text-accent">
          <div className="space-y-2">
            {[
              ['R² (Coefficient of Determination)', 'Variance explained by the model (1.0 = perfect)'],
              ['RMSE (Root Mean Squared Error)', 'Average prediction error in °C (penalizes outliers)'],
              ['MSE (Mean Squared Error)', 'Squared average error (penalizes large deviations)'],
              ['MAPE (Mean Absolute Percentage Error)', 'Relative % error across all test samples'],
              ['5-Fold Cross-Validation R²', 'Out-of-fold generalizability on training data'],
            ].map(([metric, desc]) => (
              <div key={metric}>
                <p className="text-text-primary font-medium text-xs">{metric}</p>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* Architecture */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-blue-900/30 flex items-center justify-center">
            <Layers size={17} className="text-primary" />
          </div>
          <h2 className="text-text-primary font-semibold">System Architecture</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Frontend',
              color: 'border-primary/40 bg-blue-900/10',
              items: ['React 18 + Vite', 'Tailwind CSS', 'Recharts (interactive charts)', 'Lucide React icons', 'Axios (API client)'],
            },
            {
              title: 'Backend',
              color: 'border-accent/40 bg-cyan-900/10',
              items: ['Python + FastAPI', 'Pydantic validation', 'Uvicorn ASGI server', 'Pandas + NumPy', 'CORS middleware'],
            },
            {
              title: 'ML Pipeline',
              color: 'border-success/40 bg-green-900/10',
              items: ['Scikit-learn models', 'StandardScaler', 'Joblib serialization', 'Cross-validation', '5-fold CV evaluation'],
            },
          ].map(layer => (
            <div key={layer.title} className={`border rounded-lg p-4 ${layer.color}`}>
              <p className="text-text-primary font-semibold text-sm mb-2">{layer.title}</p>
              <ul className="space-y-1">
                {layer.items.map(item => (
                  <li key={item} className="text-text-secondary text-xs flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-text-secondary shrink-0"></span> {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Limitations & Future */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section icon={AlertCircle} title="Limitations" color="text-danger">
          <ul className="space-y-1.5">
            {[
              'Dataset is synthetically generated — temperatures can exceed physical CPU T_j Max (~105°C)',
              'Voltage, Current, Clock_Speed each contribute <1% feature importance in this dataset',
              'RMSE of 11.5°C is inflated by synthetic high-temperature tail (>100°C)',
              'Model trained on simulated data; physical sensor validation not performed',
            ].map((l, i) => <li key={i} className="flex items-start gap-2"><span className="text-danger mt-0.5 text-xs">▸</span>{l}</li>)}
          </ul>
        </Section>

        <Section icon={Clock} title="Future Scope" color="text-success">
          <ul className="space-y-1.5">
            {[
              'Hyperparameter optimization via Optuna or Bayesian Search',
              'Gradient Boosted models: XGBoost, LightGBM, CatBoost',
              'Validation on physical server telemetry via IPMI or lm-sensors',
              'Time-series forecasting for proactive thermal management',
              'Real-time streaming inference with WebSocket',
              'Docker containerization for production deployment',
            ].map((f, i) => <li key={i} className="flex items-start gap-2"><span className="text-success mt-0.5 text-xs">▸</span>{f}</li>)}
          </ul>
        </Section>
      </div>
    </div>
  )
}
