/*
	Copyright (c) 2021 NerdLang - Adrien THIERRY and contributors

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in all
	copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
	SOFTWARE.

*/

#ifndef __NERD__OBJECT_VECTOR
#include "tsl/robin_map.h"
#endif

template <typename String>
struct hash_string {
	constexpr std::size_t operator()(const String& value) const {
		std::size_t d = 5381;
		for (const auto& c : value)
			d = d * 33 + static_cast<size_t>(c);
		return d;
	}
};

namespace NerdCore
{
	namespace Type
	{
		typedef std::vector<NerdCore::VAR> vector_t;
		typedef std::vector<void*> vector_p;
		typedef std::pair<std::string, NerdCore::VAR> pair_t;
		#ifndef __NERD__OBJECT_VECTOR
		//typedef tsl::robin_map<std::string, NerdCore::VAR> object_t;

		//TODO: organize
		struct HashedString {
			std::string_view str;
			std::size_t hash = 0;

			constexpr HashedString(const char* s, int Null) {
				hash = hash_string<std::string_view>()(s);
				str = s;
			}

			//HashedString(const char* s) {
			//	hash = std::hash<std::string>()(s);
			//	//std::cout << "cto " << s << "\n";
			//	str = s;
			//	//std::cout << "ctores " << str << "\n";
			//}
			//HashedString(std::string s) {
			//	hash = hash_string<std::string>()(s);
			//	str = s;
			//}
			//HashedString(std::string_view s) {
			//	str = s;
			//}

			//operator std::string_view& () { return str; }
		};

		template <class Key, class T, class Hash = std::hash<Key>,
          class KeyEqual = std::equal_to<Key>,
          class Allocator = std::allocator<std::pair<Key, T>>,
          bool StoreHash = false,
          class GrowthPolicy = tsl::rh::power_of_two_growth_policy<2>>

		class _object_t : public tsl::robin_map
			<Key, T, Hash, KeyEqual, Allocator, StoreHash, GrowthPolicy>
		{
			public:
			inline T& operator[](const Key& key){
				//std::cout << "const str " << key << "\n";
				return tsl::robin_map
				<Key, T, Hash, KeyEqual, Allocator, StoreHash, GrowthPolicy>
				::operator[](key);
			}
			inline T& operator[](Key&& key){
				//std::cout << "str " << key << "\n";
				return tsl::robin_map
				<Key, T, Hash, KeyEqual, Allocator, StoreHash, GrowthPolicy>
				::operator[](key);
			}
			inline T& operator[](NerdCore::Type::HashedString _index) {
				//std::cout << "hstr " << std::string(_index.str) << "\n";
				return this->try_emplace(std::forward<Key>(std::string(_index.str)),
					_index.hash).first.value();
			}
		};

		typedef _object_t<std::string, NerdCore::VAR, hash_string<std::string>> object_t;
		#else
		typedef std::vector<pair_t> object_t;
		#endif
		typedef std::function<NerdCore::VAR (VAR&, VAR*, int)> function_t;
		typedef std::function<void (void*)> clean_struct;
		
		#ifdef __NERD_ENV_ARDUINO
		typedef std::string StringView;
		#else 
		typedef std::string_view StringView;
		#endif
	}
}