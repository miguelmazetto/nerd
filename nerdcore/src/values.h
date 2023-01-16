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
	NerdCore::VAR null = __NERD_Create_Null();
	NerdCore::VAR undefined = __NERD_Create_Null();
	NerdCore::VAR __False = __NERD_Create_Boolean(0);
	NerdCore::VAR __True = __NERD_Create_Boolean(1);
	NerdCore::VAR Infinity = std::numeric_limits<double>::infinity();
	NerdCore::VAR NaN = std::numeric_limits<double>::quiet_NaN();
	NerdCore::VAR String = __NERD_Create_Var_Unscoped_Anon( return null; );
	NerdCore::VAR Object = __NERD_Create_Var_Unscoped_Anon( return null; );
	NerdCore::VAR Array = __NERD_Create_Var_Unscoped_Anon( return new NerdCore::Class::Array(); );
	NerdCore::VAR Function = __NERD_Create_Var_Unscoped_Anon( return null; );
	NerdCore::VAR global = new NerdCore::Class::Object();
	NerdCore::VAR __NERD_THIS = global;
	NerdCore::VAR __NERD_ARGS = new NerdCore::Class::Array();
	namespace H {
		var& Null = NerdCore::Global::null;
		var& True = NerdCore::Global::__True;
		var& False = NerdCore::Global::__False;
	}
	namespace Type { using namespace NerdCore::Enum; }
	using namespace NerdCore;
	NerdCore::VAR require;
	__NERD_STDENV_C();
}

using namespace NerdCore::Global;
#include <string>

void __NERD_INIT_VALUES(int argc, char** argv){
	for (size_t i = 0; i < argc; i++)
		__NERD_ARGS[i] = std::string(argv[i]);
	
	require = __MODULE_41266748_main();
	__NERD_STDENV_INIT();
}