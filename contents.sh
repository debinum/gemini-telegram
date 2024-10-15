#!/bin/bash
# This script will concatenate all *.js files into a single .txt file.
# Make sure to replace "output.txt" with the desired output file name.
output_file="contents.txt"
# Clear the output file
echo "" > "$output_file"
# Loop through all *.js files in the current directory
for file in *.js; do
  # Append the filename to the output file
  echo "$file" >> "$output_file"
  # Append the contents of the file to the output file
  cat "$file" >> "$output_file"
  # Add a newline to separate files
  echo "" >> "$output_file"
done
echo "All *.js files have been concatenated into $output_file."
