#pragma once

#include "../nitrogen/generated/shared/c++/HybridChartEngineNitroSpec.hpp"

namespace margelo::nitro::charts {
class HybridChartEngineNitro : public HybridChartEngineNitroSpec {
public:
  HybridChartEngineNitro() : HybridObject(TAG) {}
  std::vector<NitroPoint> downsampleSeries(const DownsampleInput& input) override;
  NearestPointResult findNearestDatum(const HitTestInput& input) override;
};
}
