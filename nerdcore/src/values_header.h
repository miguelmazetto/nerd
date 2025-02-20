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
	using let = NerdCore::VAR;
	extern var null;
	extern var undefined;
	extern var Infinity;
	extern var NaN;
	extern var __True;
	extern var __False;
	extern var EVarArg;
	
	extern var global;
	extern var __NERD_THIS;
	extern var String;
	extern var Object;
	extern var Array;
	extern var __NERD_ARGS;
	extern var require;
	__NERD_STDENV_H()

	namespace H {
		using hkey = NerdCore::Type::HashedString;
		std::size_t hash(std::string_view str);
	}
	namespace T { using namespace NerdCore::Type; }
	namespace C { using namespace NerdCore::Class; }
	namespace G { using namespace NerdCore::Global; }
	using namespace NerdCore;
}

void __NERD_INIT_VALUES(int argc, char** argv);