#include "HybridChartEngineNitro.hpp"

#include <NitroModules/HybridObjectRegistry.hpp>

namespace {
const bool kRegisterChartEngineNitro = []() {
  margelo::nitro::HybridObjectRegistry::registerHybridObjectConstructor(
      "ChartEngineNitro",
      []() -> std::shared_ptr<margelo::nitro::HybridObject> {
        return std::make_shared<margelo::nitro::charts::HybridChartEngineNitro>();
      });
  return true;
}();
}
