#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["signal-server.csproj", "."]
RUN dotnet restore "./signal-server.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "signal-server.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "signal-server.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "signal-server.dll"]
