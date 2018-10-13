var mysql = require("mysql");

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "5mysql5",
  database: "bamazon"
});

var stdin = process.openStdin();
stdin.setRawMode( true );
stdin.resume();
stdin.setEncoding( 'utf8' );

connection.connect(function(error) {

	if(error) { console.log(error); }

	showMenu();

});

var product_count = 0;
var stock_count_array = [];
var price_array = [];

function showMenu()
{
	process.stdout.write('\033c');
	console.log("bAmazon - Inventory (Customer) To exit, press Ctrl+c\n");

	connection.query("SELECT * FROM products", function(error, table) {

		if(error) { console.log(error); }


		var col_size_array = ["ID","Product Name", "Department", "Price", "Stock"];
		var col_data_array = [];
		
		table.forEach((row) => {
			
			var data_array = [row.item_id.toString(), row.product_name, row.department, row.price.toString(), row.stock_quantity.toString()];

			for(var index = 0; index < data_array.length; index++)
			{
				if(col_size_array[index].length < data_array[index].length)
				{
					var lengthDifference = data_array[index].length - col_size_array[index].length;
					col_size_array[index] += generateCharacters(lengthDifference, " ");
				}
			}	
		});

		table.forEach((row) => {

			var data_array = [row.item_id.toString(), row.product_name, row.department, row.price.toString(), row.stock_quantity.toString()];

			var price_decimal_location = data_array[3].indexOf(".");

			if(price_decimal_location !== -1)
			{
				if(data_array[3].slice(price_decimal_location).length !== 3)
				{
					data_array[3] += "0";
				}
			}
			else
			{
				data_array[3] += ".00";
			}

			for(var index = 0; index < data_array.length; index++)
			{
				if(data_array[index].length < col_size_array[index].length)
				{
					var lengthDifference = col_size_array[index].length - data_array[index].length;
					data_array[index] += generateCharacters(lengthDifference, " ");
				}
			}

			col_data_array.push(`${data_array[0]} | ${data_array[1]} | ${data_array[2]} | ${data_array[3]} | ${data_array[4]}`);
			price_array.push(data_array[3]);
			stock_count_array.push(data_array[4]);
		});
		
		
		console.log(` ${col_size_array[0]} | ${col_size_array[1]} | ${col_size_array[2]} | ${col_size_array[3]} | ${col_size_array[4]}`);
		var table_divider = generateCharacters((col_size_array[0].length + col_size_array[1].length + col_size_array[2].length + col_size_array[3].length + col_size_array[4].length) + 13, "\u2015");
		console.log(table_divider);
		col_data_array.forEach((value) => { console.log(" " + value) });
		console.log(table_divider);

		product_count = col_data_array.length;

		process.stdout.write("\nWhich product would you like to buy? (1-" + col_data_array.length + "): ");
	});
}

function generateCharacters(amount, character)
{
	var string = "";

	for(var charsAdded = 0; charsAdded < amount; charsAdded++)
	{
		string += character;
	}

	return string;
}

var question = "id";
var selection = 0;
var number_of_units = 0;

stdin.addListener("data", function(d) {

	if (d === '\u0003') 
	{ 
		connection.end();
		process.exit(); 
	}

	if(question === "id")
	{
		if(d === "\r")
		{
			if (selection <= product_count && selection !== 0 && stock_count_array[selection-1].trim() !== "0")
			{
				question = "units";
				process.stdout.write("\nHow many units of the product would you like to buy? (1-" + stock_count_array[selection-1].trim() +"): ");
			}
		}
		else if(!isNaN(d))
		{
			if(selection === 0)
			{
				if(d === "0")
				{
					return;
				}
				selection = d;
				process.stdout.cursorTo(43 + product_count.toString().length);
				process.stdout.write(d);
			}
			else
			{
				selection += d.toString();
				process.stdout.cursorTo(43 + product_count.toString().length);
				process.stdout.write(selection);
				selection = parseInt(selection);
			}
		}
		else if(d === '\u0008')
		{
			if(selection.toString().length !== 1)
			{
				selection = selection.toString();
				selection = selection.substring(0, selection.length - 1);
				process.stdout.cursorTo(43 + product_count.toString().length);
				process.stdout.write(selection + " ");
				selection = parseInt(selection);
			}
			else
			{
				selection = 0;
				process.stdout.cursorTo(43 + product_count.toString().length);
				process.stdout.write(" ");
			}
		}
		/*else if(!isNaN(d) && d !== "0")
		{
			selection = d;
			process.stdout.cursorTo(44);
			process.stdout.write(d);
		}*/
	}
	else if(question === "units")
	{
		if(d === "\r")
		{
			if (number_of_units <= parseInt(stock_count_array[selection-1].trim()) && number_of_units !== 0)
			{
				question = "another1";
				process.stdout.write("\n \nThank you for your purchase! (" + number_of_units + " units @" + price_array[selection-1] + "ea. = $" + (number_of_units * price_array[selection-1]).toFixed(2) + ")");
				connection.query("UPDATE products SET stock_quantity = ? WHERE item_id = ?", [(parseInt(stock_count_array[selection-1].trim()) - number_of_units), (selection)], function(error, table) {

					if(error) { console.log(error); }
					
					process.stdout.write("\nWould you like to buy another product? (y/n):");
				});
			}
		}
		else if(!isNaN(d))
		{
			if(number_of_units === 0)
			{
				if(d === "0")
				{
					return;
				}
				number_of_units = d;
				process.stdout.cursorTo(59 + stock_count_array[selection-1].trim().length);
				process.stdout.write(d);
			}
			else
			{
				number_of_units += d.toString();
				process.stdout.cursorTo(59 + stock_count_array[selection-1].trim().length);
				process.stdout.write(number_of_units);
				number_of_units = parseInt(number_of_units);
			}
		}
		else if(d === '\u0008')
		{
			if(number_of_units.toString().length !== 1)
			{
				number_of_units = number_of_units.toString();
				number_of_units = number_of_units.substring(0, number_of_units.length - 1);
				process.stdout.cursorTo(59 + stock_count_array[selection-1].trim().length);
				process.stdout.write(number_of_units + " ");
				number_of_units = parseInt(number_of_units);
			}
			else
			{
				number_of_units = 0;
				process.stdout.cursorTo(59 + stock_count_array[selection-1].trim().length);
				process.stdout.write(" ");
			}
		}
	}
	else if(question === "another1")
	{
		if(d.toLowerCase() === "y")
		{
			question = "id";
			product_count = 0;
			stock_count_array = [];
			price_array = [];
			selection = 0;
			number_of_units = 0;
			showMenu();
		}
		else
		{
			console.log("\nBye!");
			process.exit();
		}
	}
});

