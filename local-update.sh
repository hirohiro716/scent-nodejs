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
cp -r $scriptDirectory/* $currentDirectory/node_modules/scent-nodejs

