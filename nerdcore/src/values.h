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

namespace NerdCore::Global
{	
	using var = NerdCore::VAR;
	var null = __NERD_Create_Null();
	var undefined = __NERD_Create_Null();
	var __False = __NERD_Create_Boolean(0);
	var __True = __NERD_Create_Boolean(1);
	var Infinity = std::numeric_limits<double>::infinity();
	var NaN = std::numeric_limits<double>::quiet_NaN();
	var EVarArg = var(Enum::VarArg, 1);
	
	var String = __NERD_Create_Var_Unscoped_Anon( return null; );
	var Object = __NERD_Create_Var_Unscoped_Anon( return null; );
	var Array = __NERD_Create_Var_Unscoped_Anon( return new NerdCore::Class::Array(); );
	var global = new NerdCore::Class::Object();
	var __NERD_THIS = global;
	var __NERD_ARGS = new NerdCore::Class::Array();
	var require;
	__NERD_STDENV_C();

	namespace H {
		std::size_t hash(std::string_view str) {
			return ankerl::unordered_dense::hash<std::string_view>()(str);
		}
	}
}

using namespace NerdCore::Global;
#include <string>

void __NERD_INIT_VALUES(int argc, char** argv){
	for (size_t i = 0; i < argc; i++)
		__NERD_ARGS[i] = std::string(argv[i]);
	
	require = __MODULE_41266748_main();
	__NERD_STDENV_INIT();
}