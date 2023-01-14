cmake_minimum_required(VERSION 3.8)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)
project(uSockets)

set(LIBUV_BUILD_SHARED OFF CACHE BOOL "Build shared lib" FORCE)
add_subdirectory(../libuv ${CMAKE_CURRENT_BINARY_DIR}/libuv)

set(WOLFSSL_EXAMPLES OFF CACHE BOOL "Enable examples (default: enabled)" FORCE)
set(WOLFSSL_CRYPT_TESTS OFF CACHE BOOL "Enable Crypt Bench/Test (default: enabled)" FORCE)
set(BUILD_SHARED_LIBS OFF CACHE BOOL "Build shared libraries (.dll/.so) instead of static ones (.lib/.a)" FORCE)
add_subdirectory(../wolfssl ${CMAKE_CURRENT_BINARY_DIR}/wolfssl)
target_compile_definitions(wolfssl PUBLIC HAVE_EX_DATA HAVE_LIGHTY)

file(GLOB SRC_FILES 
	src/*.c
	src/eventing/*.c
	src/crypto/*.c
	src/crypto/*.cpp
)

add_library(uSockets STATIC ${SRC_FILES})

target_link_libraries(uSockets wolfssl uv_a)
target_compile_definitions(uSockets PUBLIC LIBUS_USE_WOLFSSL LIBUS_USE_LIBUV)

target_include_directories(uSockets PUBLIC src)