let positionChart, velocityChart, accelerationChart;
const SIMULATION_DURATION = 30; // 30 seconds

// State management
let currentState = {
  velocity: 0,
  acceleration: 0
};

let carTimeline; // GSAP timeline for car animation

function initAnimation() {
  // Reset any existing animation
  if (carTimeline) {
    carTimeline.kill();
  }

  // Get container width for car movement
  const containerWidth = document.querySelector('.car-container').offsetWidth - 60; // Subtract car width

  // Calculate final position based on physics
  const isLinearAcceleration = document.getElementById('scenario').value === 'linear_acceleration';
  const v0 = currentState.velocity;
  const a = currentState.acceleration;

  // Calculate final position for scaling
  let finalPosition;
  if (isLinearAcceleration) {
    finalPosition = v0 * SIMULATION_DURATION + (1 / 6) * Math.pow(SIMULATION_DURATION, 3);
  } else {
    finalPosition = v0 * SIMULATION_DURATION + 0.5 * a * Math.pow(SIMULATION_DURATION, 2);
  }

  // Update max distance in the track label
  const maxDistance = Math.ceil(finalPosition / 100) * 100; // Round up to nearest 100
  document.getElementById('maxDistanceValue').textContent = maxDistance + ' m';

  // Create new timeline
  carTimeline = gsap.timeline({
    paused: true,
    onUpdate: function () {
      const currentTime = carTimeline.time();
      let currentPosition;

      // Calculate current position based on physics equations
      if (isLinearAcceleration) {
        currentPosition = v0 * currentTime + (1 / 6) * Math.pow(currentTime, 3);
      } else {
        currentPosition = v0 * currentTime + 0.5 * a * Math.pow(currentTime, 2);
      }

      // Scale position to fit container
      const scaleFactor = containerWidth / Math.max(finalPosition, 1);
      const scaledPosition = Math.min(currentPosition * scaleFactor, containerWidth);

      // Update car position
      gsap.set('.car', { x: scaledPosition });

      // Update distance label and progress
      document.getElementById('distanceValue').textContent = Math.round(currentPosition * 10) / 10 + ' m';
      const distanceProgress = (currentPosition / maxDistance) * 100;
      gsap.set('.distance-progress', { width: distanceProgress + '%' });

      // Update timeline
      const progress = Math.min(currentTime / SIMULATION_DURATION, 1);
      gsap.set('.timeline-progress', { width: (progress * 100) + '%' });
      gsap.set('.timeline-handle', { left: (progress * 100) + '%' });

      // Update time display
      document.getElementById('timeValue').textContent = Math.round(currentTime) + 's';

      // Update vertical lines in charts
      [positionChart, velocityChart, accelerationChart].forEach(chart => {
        chart.options.plugins.annotation.annotations.timeLine.xMin = currentTime;
        chart.options.plugins.annotation.annotations.timeLine.xMax = currentTime;
        chart.update('none');
      });

      // Stop animation if car reaches the end
      if (scaledPosition >= containerWidth) {
        carTimeline.pause();
      }
    }
  });

  // Add a dummy tween to drive the timeline
  carTimeline.to({}, {
    duration: SIMULATION_DURATION,
    ease: "none"
  });

  // Play animation
  carTimeline.play();
}

// Preset scenarios
const SCENARIOS = {
  constant_zero: {
    name: "No Motion (v=0, a=0)",
    velocity: 0,
    acceleration: 0,
    yAxisMax: { position: 50, velocity: 20, acceleration: 5 }
  },
  constant_velocity: {
    name: "Constant Velocity (v>0, a=0)",
    velocity: 10,
    acceleration: 0,
    yAxisMax: { position: 500, velocity: 20, acceleration: 5 }
  },
  constant_acceleration: {
    name: "Constant Acceleration (v=0, a>0)",
    velocity: 0,
    acceleration: 2,
    yAxisMax: { position: 1000, velocity: 60, acceleration: 5 }
  },
  constant_acceleration_with_velocity: {
    name: "Constant Acceleration with Initial Velocity (v>0, a>0)",
    velocity: 5,
    acceleration: 2,
    yAxisMax: { position: 1500, velocity: 65, acceleration: 5 }
  },
  linear_acceleration: {
    name: "Linear Acceleration (a=kt)",
    velocity: 0,
    acceleration: 0,
    yAxisMax: { position: 2000, velocity: 100, acceleration: 15 }
  }
};

// Chart.js configuration for all graphs
const chartConfig = {
  type: 'line',
  options: {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 1.0,
    animation: {
      duration: 0
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    layout: {
      padding: {
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      }
    },
    plugins: {
      annotation: {
        annotations: {
          timeLine: {
            type: 'line',
            xMin: 0,
            xMax: 0,
            borderColor: 'rgba(255, 99, 132, 0.5)',
            borderWidth: 2,
            borderDash: [5, 5],
            drawTime: 'beforeDatasetsDraw'
          }
        }
      },
      title: {
        display: true,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          top: 0,
          bottom: 10
        }
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        position: 'nearest'
      }
    },
    scales: {
      x: {
        type: 'linear',
        display: true,
        title: {
          display: true,
          text: 'x',
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: {
            top: 10
          }
        },
        min: 0,
        max: SIMULATION_DURATION,
        ticks: {
          stepSize: 5,
          font: {
            size: 12
          }
        },
        grid: {
          color: '#e0e0e0'
        }
      },
      y: {
        display: true,
        beginAtZero: true,
        title: {
          font: {
            size: 14,
            weight: 'bold'
          },
          padding: {
            bottom: 10
          }
        },
        ticks: {
          font: {
            size: 12
          }
        },
        grid: {
          color: '#e0e0e0'
        }
      }
    }
  }
};

function createChart(canvasId, label, color, maxY) {
  const config = JSON.parse(JSON.stringify(chartConfig));
  config.data = {
    datasets: [
      {
        label: label,
        data: [],
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        tension: 0
      },
      {
        label: 'Data Points',
        data: [],
        borderColor: color,
        backgroundColor: color,
        borderWidth: 0,
        pointRadius: 4,
        pointHoverRadius: 6,
        showLine: false
      }
    ]
  };
  config.options.plugins.title.text = label;
  config.options.scales.y.title = {
    display: true,
    text: label,
    font: {
      size: 14,
      weight: 'bold'
    }
  };
  config.options.scales.y.max = maxY;

  const chart = new Chart(document.getElementById(canvasId), config);
  return chart;
}

function init() {
  // Initialize charts with different colors and y-axis limits
  const scenario = SCENARIOS['constant_velocity'];
  positionChart = createChart('positionGraph', 'Position (m)', '#2196F3', scenario.yAxisMax.position);
  velocityChart = createChart('velocityGraph', 'Velocity (m/s)', '#4CAF50', scenario.yAxisMax.velocity);
  accelerationChart = createChart('accelerationGraph', 'Acceleration (m/s²)', '#F44336', scenario.yAxisMax.acceleration);

  // Set up event listener for scenario dropdown
  document.getElementById('scenario').addEventListener('change', handleScenarioChange);

  // Add mousemove event listener to sync charts
  [positionChart, velocityChart, accelerationChart].forEach(chart => {
    chart.canvas.addEventListener('mousemove', (e) => {
      const activePoints = chart.getElementsAtEventForMode(e, 'index', { intersect: false });
      if (activePoints.length > 0) {
        const xValue = chart.data.datasets[0].data[activePoints[0].index].x;
        [positionChart, velocityChart, accelerationChart].forEach(otherChart => {
          if (otherChart !== chart) {
            const tooltip = otherChart.tooltip;
            const dataPoint = otherChart.data.datasets[0].data.find(point => point.x === xValue);
            if (dataPoint) {
              tooltip.setActiveElements([{
                datasetIndex: 0,
                index: otherChart.data.datasets[0].data.indexOf(dataPoint)
              }], {
                x: e.offsetX,
                y: e.offsetY
              });
            }
            otherChart.update('none');
          }
        });
      }
    });

    chart.canvas.addEventListener('mouseleave', () => {
      [positionChart, velocityChart, accelerationChart].forEach(otherChart => {
        otherChart.tooltip.setActiveElements([], {});
        otherChart.update('none');
      });
    });
  });

  // Initial setup - trigger scenario change
  handleScenarioChange();
}

function handleScenarioChange() {
  const selectedScenario = document.getElementById('scenario').value;
  const scenario = SCENARIOS[selectedScenario];

  // Update state
  currentState.velocity = scenario.velocity;
  currentState.acceleration = scenario.acceleration;

  // Reset car position and timeline
  gsap.set('.car', { x: 0 });
  gsap.set('.timeline-progress', { width: 0 });
  gsap.set('.timeline-handle', { left: 0 });
  gsap.set('.distance-progress', { width: 0 });
  document.getElementById('timeValue').textContent = '0s';
  document.getElementById('distanceValue').textContent = '0 m';

  // Update y-axis limits
  positionChart.options.scales.y.max = scenario.yAxisMax.position;
  velocityChart.options.scales.y.max = scenario.yAxisMax.velocity;
  accelerationChart.options.scales.y.max = scenario.yAxisMax.acceleration;

  // Generate data points and update charts
  const timePoints = Array.from({ length: SIMULATION_DURATION + 1 }, (_, i) => i);
  const data = timePoints.map(t => {
    const isLinearAcceleration = selectedScenario === 'linear_acceleration';
    const acceleration = isLinearAcceleration ? t * 0.5 : currentState.acceleration;
    const velocity = currentState.velocity + (isLinearAcceleration ? 0.25 * t * t : acceleration * t);
    const position = currentState.velocity * t + (isLinearAcceleration ? (1 / 6) * t * t * t : 0.5 * acceleration * t * t);

    return {
      time: t,
      position: position,
      velocity: velocity,
      acceleration: acceleration
    };
  });

  // Update charts and equations
  updateCharts(data);
  updateEquations();

  // Initialize animation
  initAnimation();
}

function updateEquations() {
  const selectedScenario = document.getElementById('scenario').value;
  const v0 = currentState.velocity;
  const a = currentState.acceleration;

  let posEq, velEq, accEq;

  switch (selectedScenario) {
    case 'constant_zero':
      posEq = '\\(p(x) = \\int v(x)\\,dx = \\int 0\\,dx = 0\\)';
      velEq = '\\(v(x) = 0\\)';
      accEq = '\\(a(x) = \\frac{d}{dx}v(x) = \\frac{d}{dx}(0) = 0\\)';
      break;
    case 'constant_velocity':
      posEq = `\\(p(x) = \\int v(x)\\,dx = \\int ${v0}\\,dx = ${v0}x\\)`;
      velEq = `\\(v(x) = ${v0}\\)`;
      accEq = `\\(a(x) = \\frac{d}{dx}v(x) = \\frac{d}{dx}(${v0}) = 0\\)`;
      break;
    case 'constant_acceleration':
      posEq = `\\(p(x) = \\int v(x)\\,dx = \\int ${a}x\\,dx = \\frac{1}{2}(${a})x^2\\)`;
      velEq = `\\(v(x) = ${a}x\\)`;
      accEq = `\\(a(x) = \\frac{d}{dx}v(x) = \\frac{d}{dx}(${a}x) = ${a}\\)`;
      break;
    case 'constant_acceleration_with_velocity':
      posEq = `\\(p(x) = \\int v(x)\\,dx = \\int (${v0} + ${a}x)\\,dx = ${v0}x + \\frac{1}{2}(${a})x^2\\)`;
      velEq = `\\(v(x) = ${v0} + ${a}x\\)`;
      accEq = `\\(a(x) = \\frac{d}{dx}v(x) = \\frac{d}{dx}(${v0} + ${a}x) = ${a}\\)`;
      break;
    case 'linear_acceleration':
      posEq = '\\(p(x) = \\int v(x)\\,dx = \\int \\frac{1}{2}x^2\\,dx = \\frac{1}{6}x^3\\)';
      velEq = '\\(v(x) = \\frac{1}{2}x^2\\)';
      accEq = '\\(a(x) = \\frac{d}{dx}v(x) = \\frac{d}{dx}(\\frac{1}{2}x^2) = x\\)';
      break;
  }

  document.getElementById('positionEquation').innerHTML = posEq;
  document.getElementById('velocityEquation').innerHTML = velEq;
  document.getElementById('accelerationEquation').innerHTML = accEq;

  // Trigger MathJax to reprocess the equations
  if (window.MathJax) {
    MathJax.typesetPromise();
  }
}

function handleParameterChange() {
  // Update state with current values
  currentState.velocity = parseFloat(document.getElementById('initialVelocity').value);
  currentState.acceleration = parseFloat(document.getElementById('acceleration').value);

  // Update value displays
  document.getElementById('velocityValue').textContent = currentState.velocity;
  document.getElementById('accelerationValue').textContent = currentState.acceleration;

  // Reset car position and timeline
  gsap.set('.car', { x: 0 });
  gsap.set('.timeline-progress', { width: 0 });
  gsap.set('.timeline-handle', { left: 0 });
  document.getElementById('timeValue').textContent = '0s';
  document.getElementById('distanceValue').textContent = '0 m';

  // Update equations
  updateEquations();

  // Generate data points
  const timePoints = Array.from({ length: SIMULATION_DURATION + 1 }, (_, i) => i);
  const data = timePoints.map(t => {
    const isLinearAcceleration = document.querySelector('input[name="scenario"]:checked').value === 'linear_acceleration';
    const acceleration = isLinearAcceleration ? t * 0.5 : currentState.acceleration;
    const velocity = currentState.velocity + (isLinearAcceleration ? 0.25 * t * t : acceleration * t);
    const position = currentState.velocity * t + (isLinearAcceleration ? (1 / 6) * t * t * t : 0.5 * acceleration * t * t);

    return {
      time: t,
      position: position,
      velocity: velocity,
      acceleration: acceleration
    };
  });

  // Update charts
  updateCharts(data);

  // Update animation
  initAnimation();

  // Reset chart highlights
  [positionChart, velocityChart, accelerationChart].forEach(chart => {
    chart.setActiveElements([]);
    chart.update('none');
  });

  // Reset vertical lines
  [positionChart, velocityChart, accelerationChart].forEach(chart => {
    chart.options.plugins.annotation.annotations.timeLine.xMin = 0;
    chart.options.plugins.annotation.annotations.timeLine.xMax = 0;
    chart.update('none');
  });
}

function updateCharts(data) {
  const charts = [
    { chart: positionChart, key: 'position' },
    { chart: velocityChart, key: 'velocity' },
    { chart: accelerationChart, key: 'acceleration' }
  ];

  charts.forEach(({ chart, key }) => {
    // Update line plot with all points
    chart.data.datasets[0].data = data.map(d => ({
      x: d.time,
      y: d[key]
    }));

    // Update data points (show fewer points for better performance)
    chart.data.datasets[1].data = data
      .filter((_, i) => i % 5 === 0 || i === data.length - 1) // Show every 5th point and the last point
      .map(d => ({
        x: d.time,
        y: d[key]
      }));

    // Dynamically adjust y-axis maximum for position and velocity charts
    if (key === 'position' || key === 'velocity') {
      const maxValue = Math.max(...data.map(d => d[key]));
      const buffer = maxValue * 0.1; // Add 10% buffer
      const minMax = key === 'position' ? 50 : 20; // Minimum max value for visibility
      chart.options.scales.y.max = Math.max(maxValue + buffer, minMax);
    }

    chart.update('none');
  });
}

// Add event listener for DOMContentLoaded to ensure init runs when page loads
document.addEventListener('DOMContentLoaded', init); 