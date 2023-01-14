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

using namespace NerdCore::Global;

#define CallFT(func, This, _args, i) std::invoke((*static_cast<NerdCore::Type::function_t *>(func)), This, _args, i)

namespace NerdCore::Helper
{
   void for_in_loop(NerdCore::VAR This, const NerdCore::VAR obj, NerdCore::Type::function_t* func){
		NerdCore::VAR it;
    	if (obj.type == NerdCore::Enum::Type::Object) {
          for (auto __NERD_ITERATOR = ((NerdCore::Class::Object * ) obj.data.ptr) -> object.begin();
    	  		__NERD_ITERATOR != ((NerdCore::Class::Object * ) obj.data.ptr) -> object.end();
    			++__NERD_ITERATOR) {

            if (__NERD_ITERATOR->first.compare("__proto__") != 0) {
			  it = __NERD_ITERATOR->first;
              if(CallFT(func, This, &it, 1) == __True)
    		  	break;
            }
          }
        } else if (obj.type == NerdCore::Enum::Type::Array) {
          for (size_t __NERD_ITERATOR = 0;
    	  		__NERD_ITERATOR < ((NerdCore::Class::Array * )
    			obj.data.ptr)->value.size(); __NERD_ITERATOR++) {
			
			it = __NERD_ITERATOR;
            if(CallFT(func, This, &it, 1) == __True)
    		  	break;
          }
        } else if (obj.type == NerdCore::Enum::Type::String) {
          for (size_t __NERD_ITERATOR = 0;
    	  		__NERD_ITERATOR < ((NerdCore::Class::String * ) obj.data.ptr)->value.length();
    			__NERD_ITERATOR++) {

			it = __NERD_ITERATOR;
            if(CallFT(func, This, &it, 1) == __True)
    		  	break;
          }
        }
    }
}