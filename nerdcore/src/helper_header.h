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

namespace NerdCore::Helper
{
    void for_in_loop(NerdCore::VAR This, const NerdCore::VAR obj, NerdCore::Type::function_t* func);
}

//__forceinline NerdCore::VAR& NerdCore::VAR::operator[] (const char* _index) {
//	if (type < NerdCore::Enum::Type::String) return NerdCore::Global::null;
//
//	if (__NERD_STATIC_STREQUAL(_index, "length"))
//	{
//		if (type == NerdCore::Enum::Type::Array)
//		{
//			((NerdCore::Class::Array*)data.ptr)->length = ((NerdCore::Class::Array*)data.ptr)->value.size();
//			return ((NerdCore::Class::Array*)data.ptr)->length;
//		}
//		else if (type == NerdCore::Enum::Type::String)
//		{
//			((NerdCore::Class::String*)data.ptr)->length = ((NerdCore::Class::String*)data.ptr)->value.length();
//			return ((NerdCore::Class::String*)data.ptr)->length;
//		}
//	}
//	return __NERD_VAR_GETHASHED(*this, _index);
//}

//constexpr bool strings_equal(char const* a, char const* b) {
//	return std::string_view(a) == b;
//}

//__forceinline NerdCore::VAR& NerdCore::VAR::operator[] (NerdCore::Type::HashedString _index) {
//	if (type < NerdCore::Enum::Type::String) return __NERD_Create_Null();
//	if (_index.str == std::string_view("length"))
//	{
//		if (type == NerdCore::Enum::Type::Array)
//		{
//			((NerdCore::Class::Array*)data.ptr)->length = ((NerdCore::Class::Array*)data.ptr)->value.size();
//			return ((NerdCore::Class::Array*)data.ptr)->length;
//		}
//		else if (type == NerdCore::Enum::Type::String)
//		{
//			((NerdCore::Class::String*)data.ptr)->length = ((NerdCore::Class::String*)data.ptr)->value.length();
//			return ((NerdCore::Class::String*)data.ptr)->length;
//		}
//	}
//	return (*(NerdCore::Class::Base*)data.ptr)[_index];
//}