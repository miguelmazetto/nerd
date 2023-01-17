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
#include "map/unordered_dense.h"
#include "map/robin_hood.h"
#endif

namespace NerdCore
{
	namespace Type
	{

		typedef std::vector<NerdCore::VAR> vector_t;
		typedef std::vector<void*> vector_p;
		typedef std::pair<std::string, NerdCore::VAR> pair_t;
		#ifndef __NERD__OBJECT_VECTOR

		//TODO: organize
		struct HashedString {
			std::string str;
			std::size_t hash;
		};

		template <class Key, class T, class Hash>
		class _object_t : public robin_hood::unordered_flat_map<Key, T, Hash>
		{
		public:
			inline T& operator[](const Key& key) {
				return robin_hood::unordered_flat_map<Key, T, Hash>::operator[](key);
			}
			inline T& operator[](Key&& key) {
				return robin_hood::unordered_flat_map<Key, T, Hash>::operator[](key);
			}
			inline T& operator[](const NerdCore::Type::HashedString& _index) {
				return robin_hood::unordered_flat_map<Key, T, Hash>::GetHashed(_index.str, _index.hash);
			}
		};
		typedef _object_t<std::string, NerdCore::VAR, ankerl::unordered_dense::hash<std::string>> object_t;
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