#!/bin/bash
currentDirectory=`pwd`
scriptDirectory=`dirname $0`
if [ ! -d $currentDirectory/node_modules/scent-nodejs/dist ]; then
    echo "The scent library is not installed."
    exit 1
fi
cd $scriptDirectory
npx tsc
cd $currentDirectory
cp -r $scriptDirectory/dist/ $currentDirectory/node_modules/scent-nodejs
rm -r $currentDirectory/.next/static 1>/dev/null 2>/dev/null
rm -r $currentDirectory/.next/cache 1>/dev/null 2>/dev/null
rm -r $currentDirectory/node_modules/.vite/ 1>/dev/null 2>/dev/null
