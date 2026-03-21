#include "HybridChartEngineNitro.hpp"

#include <cmath>
#include <limits>
#include <variant>

#include <NitroModules/Null.hpp>

namespace margelo::nitro::charts {
std::vector<NitroPoint> HybridChartEngineNitro::downsampleSeries(const DownsampleInput& input) {
  if (input.threshold <= 0 || input.points.size() <= input.threshold) {
    return input.points;
  }

  const auto end = input.points.begin() + static_cast<long>(input.threshold);
  return std::vector<NitroPoint>(input.points.begin(), end);
}

NearestPointResult HybridChartEngineNitro::findNearestDatum(const HitTestInput& input) {
  if (input.points.empty()) {
    return NearestPointResult(std::nullopt, -1, std::numeric_limits<double>::infinity());
  }

  double bestIndex = 0;
  NitroPoint bestPoint = input.points[0];
  double bestDistance = std::numeric_limits<double>::infinity();

  for (size_t index = 0; index < input.points.size(); index++) {
    const auto& point = input.points[index];
    const double dx = point.x - input.targetX;
    const double dy = input.targetY.has_value() ? point.y - input.targetY.value() : 0.0;
    const double currentDistance = std::sqrt((dx * dx) + (dy * dy));
    if (currentDistance < bestDistance) {
      bestDistance = currentDistance;
      bestIndex = static_cast<double>(index);
      bestPoint = point;
    }
  }

  return NearestPointResult(std::variant<nitro::NullType, NitroPoint>(bestPoint), bestIndex, bestDistance);
}
}
