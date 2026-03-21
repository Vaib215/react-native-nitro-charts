require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = 'react-native-nitro-charts'
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = 'MIT'
  s.homepage     = 'https://github.com/vaib215/react-native-nitro-charts'
  s.author       = { 'Vaibhav Kumar Singh' => 'sisodiya.vaib215@gmail.com' }
  s.platforms    = { :ios => '15.1' }
  s.source       = { :git => 'https://github.com/vaib215/react-native-nitro-charts.git', :tag => s.version.to_s }
  s.source_files = 'ios/**/*.{h,m,mm,swift}', 'cpp/**/*.{hpp,cpp,c,h}'
  s.dependency 'React-Core'
  s.dependency 'React-callinvoker'
  s.dependency 'ReactCommon/turbomodule/core'
  s.dependency 'NitroModules'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'CLANG_CXX_LANGUAGE_STANDARD' => 'c++20'
  }

  load 'nitrogen/generated/ios/ExpoCharts+autolinking.rb' if File.exist?(File.join(__dir__, 'nitrogen/generated/ios/ExpoCharts+autolinking.rb'))
  add_nitrogen_files(s) if defined?(add_nitrogen_files)
end
